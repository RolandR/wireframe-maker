
function Renderer(canvasId){

	const canvas = document.getElementById(canvasId);

	canvas.width = document.getElementById("canvasContainer").clientWidth;
	canvas.height = document.getElementById("canvasContainer").clientHeight;
	
	const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	let shaderProgram;

	let transformMatrixRef;
	let normalTransformRef;
	let aspectRef;
	let colorRef;
	
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
		objectColorRef = gl.getUniformLocation(shaderProgram, "objectColor");
		
	}
	
	/*function highlightVertex(index){
		
		if(highlightedIndex === index){
			return;
		}
		
		for(let e in model.edges){
			
			if(model.edges[e].a.id == highlightedIndex){
				
				colorData[e*2*3+0] = defaultColor[0];
				colorData[e*2*3+1] = defaultColor[1];
				colorData[e*2*3+2] = defaultColor[2];
				
			}
			
			if(model.edges[e].a.id == index){
				
				colorData[e*2*3+0] = highlightColor[0];
				colorData[e*2*3+1] = highlightColor[1];
				colorData[e*2*3+2] = highlightColor[2];
				
			}
			
			if(model.edges[e].b.id == highlightedIndex){
				
				colorData[e*2*3+3] = defaultColor[0];
				colorData[e*2*3+4] = defaultColor[1];
				colorData[e*2*3+5] = defaultColor[2];
				
			}
			
			if(model.edges[e].b.id == index){
				
				colorData[e*2*3+3] = highlightColor[0];
				colorData[e*2*3+4] = highlightColor[1];
				colorData[e*2*3+5] = highlightColor[2];
				
			}
			
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
		
		highlightedIndex = index;
		
	}*/

	/*function addEdges(mdl){
		
		model = mdl;
		
		size = model.edges.length*2;
		
		let vertexData = new Float32Array(size*2*3);
		colorData = new Float32Array(size*2*3);
		
		for(let e in model.edges){
			vertexData[e*2*3+0] = model.edges[e].a.x;
			vertexData[e*2*3+1] = model.edges[e].a.y;
			vertexData[e*2*3+2] = model.edges[e].a.z;
			
			vertexData[e*2*3+3] = model.edges[e].b.x;
			vertexData[e*2*3+4] = model.edges[e].b.y;
			vertexData[e*2*3+5] = model.edges[e].b.z;
			
			colorData[e*2*3+0] = defaultColor[0];
			colorData[e*2*3+1] = defaultColor[1];
			colorData[e*2*3+2] = defaultColor[2];
			
			colorData[e*2*3+3] = defaultColor[0];
			colorData[e*2*3+4] = defaultColor[1];
			colorData[e*2*3+5] = defaultColor[2];
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		
		var coord = gl.getAttribLocation(shaderProgram, "coordinates");
		gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(coord);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
		
		var colorAttrib = gl.getAttribLocation(shaderProgram, "vertexColor");
		gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(colorAttrib);

	}*/
	
	function addObject(triangles, normals, color){
		
		let vertexData = new Float32Array(triangles);
		let normalsData = new Float32Array(normals);
		
		if(!color){
			color = defaultColor;
		}
		
		
		let meshObject = {
			size: triangles.length/3,
			color: color,
			vertexData: vertexData,
			normalsData: normalsData,
			vertexBuffer: gl.createBuffer(),
			normalsBuffer: gl.createBuffer(),
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
	};

}