
function Renderer(canvasId){

	const canvas = document.getElementById(canvasId);

	canvas.width = document.getElementById("canvasContainer").clientWidth;
	canvas.height = document.getElementById("canvasContainer").clientHeight;
	
	const gl = canvas.getContext("webgl", {preserveDrawingBuffer: true, antialias: false}) || canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true, antialias: false});

	let shaderProgram;

	let transformMatrixRef;
	let normalTransformRef;
	let aspectRef;
	let colorRef;
	let idRef;
	
	let highlightedIndex = null;
	let highlightColor = [1.0, 0.7, 0.0];
	let defaultColor = [0.5, 0.5, 0.5];
	
	let meshObjects = [];
	
	init();

	function init(){

		gl.enable(gl.DEPTH_TEST);

		//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		//gl.enable(gl.BLEND);

		/*=========================Shaders========================*/

		// Create a vertex shader object
		var vertShader = gl.createShader(gl.VERTEX_SHADER);

		// Attach vertex shader source code
		gl.shaderSource(vertShader, vertexShader);

		// Compile the vertex shader
		gl.compileShader(vertShader);

		// Create fragment shader object
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

		// Attach fragment shader source code
		gl.shaderSource(fragShader, fragmentShader);

		// Compile the fragmentt shader
		gl.compileShader(fragShader);

		// Create a shader program object to store
		// the combined shader program
		shaderProgram = gl.createProgram();

		// Attach a vertex shader
		gl.attachShader(shaderProgram, vertShader); 

		// Attach a fragment shader
		gl.attachShader(shaderProgram, fragShader);

		// Link both programs
		gl.linkProgram(shaderProgram);

		// Use the combined shader program object
		gl.useProgram(shaderProgram);
		
		var vertInfo = gl.getShaderInfoLog(vertShader);
		var fragInfo = gl.getShaderInfoLog(fragShader);
		var programInfo = gl.getProgramInfoLog(shaderProgram);

		if(vertInfo){
			console.info(vertInfo);
		}
		if(fragInfo){
			console.info(fragInfo);
		}
		if(programInfo){
			console.info(programInfo);
		}
		
		maxDistanceRef = gl.getUniformLocation(shaderProgram, "maxDistance");
		modelRef = gl.getUniformLocation(shaderProgram, "model");
		viewRef = gl.getUniformLocation(shaderProgram, "view");
		perspectiveRef = gl.getUniformLocation(shaderProgram, "perspective");
		normalTransformRef = gl.getUniformLocation(shaderProgram, "normalTransform");
		aspectRef = gl.getUniformLocation(shaderProgram, "aspect");
		idRef = gl.getUniformLocation(shaderProgram, "partID");
		objectColorRef = gl.getUniformLocation(shaderProgram, "objectColor");
		
	}
	
	function addObject(triangles, normals, color, id, type){
		
		let vertexData = new Float32Array(triangles);
		let normalsData = new Float32Array(normals);
		
		if(!color){
			color = defaultColor;
		}
		
		if(!id){
			id = 0;
		}
		
		id = parseInt(id);
		
		let idArray = new Uint8Array(4);
		
		switch(type){
			case "corner":
				idArray[3] = 254;
			break;
			
			case "edge":
				idArray[3] = 253;
			break;
			
			case "pin":
				idArray[3] = 0;
			break;
			
			default:
				idArray[3] = 0;
			break;
		}
		
		idArray[2] = id%256;
		idArray[1] = (id>>8)%256;
		idArray[0] = (id>>16)%256;
		
		
		let meshObject = {
			size: triangles.length/3,
			color: color,
			visible: true,
			vertexData: vertexData,
			normalsData: normalsData,
			vertexBuffer: gl.createBuffer(),
			normalsBuffer: gl.createBuffer(),
			idArray: idArray,
		};
		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, meshObject.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, meshObject.vertexData, gl.STATIC_DRAW);
		
		let coord = gl.getAttribLocation(shaderProgram, "coordinates");
		gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(coord);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, meshObject.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, meshObject.normalsData, gl.STATIC_DRAW);
		
		let normal = gl.getAttribLocation(shaderProgram, "vertexNormal");
		gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(normal);
		
		meshObjects.push(meshObject);
		
		return meshObject;

	}
	
	function render(modelMatrix, view, perspective){
		
		var normalsMatrix = normalMatrix(modelMatrix);

		gl.uniform1f(maxDistanceRef, 3.0);
		
		gl.uniformMatrix4fv(modelRef, false, modelMatrix);
		gl.uniformMatrix4fv(viewRef, false, view);
		gl.uniformMatrix4fv(perspectiveRef, false, perspective);
		gl.uniformMatrix4fv(normalTransformRef, false, normalsMatrix);
		gl.uniform1f(aspectRef, canvas.width/canvas.height);

		// Clear the canvas
		gl.clearColor(0, 0, 0, 0);
		
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		//gl.enable(gl.BLEND);
		//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		//gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
		
		for(let i in meshObjects){
			
			let obj = meshObjects[i];
			
			if(!obj.visible){
				continue;
			}
			
			gl.uniform4iv(idRef, obj.idArray);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
			let coords = gl.getAttribLocation(shaderProgram, "coordinates");
			gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(coords);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalsBuffer);
			let normal = gl.getAttribLocation(shaderProgram, "vertexNormal");
			gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(normal);
			
			gl.uniform3fv(objectColorRef, obj.color);
			
			gl.drawArrays(gl.TRIANGLES, 0, obj.size);
			
		}
		
	}

	return{
		addObject: addObject,
		render: render,
		context: gl,
	};

}