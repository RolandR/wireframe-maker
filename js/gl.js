
function Renderer(canvasId){

	var canvas = document.getElementById(canvasId);

	canvas.width = document.getElementById("canvasContainer").clientWidth;
	canvas.height = document.getElementById("canvasContainer").clientHeight;
	
	var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	var shaderProgram;
	var size;

	var vertexBuffer;
	var normalsBuffer;
	var colorBuffer;

	var transformMatrixRef;
	var normalTransformRef;
	var aspectRef;
	
	let model;
	let highlightedIndex = null;
	let highlightColor = [1.0, 0.7, 0.0];
	let defaultColor = [0.5, 0.5, 0.5];
	let colorData;
	
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


		vertexBuffer = gl.createBuffer();
		normalsBuffer = gl.createBuffer();
		colorBuffer = gl.createBuffer();
		
		maxDistanceRef = gl.getUniformLocation(shaderProgram, "maxDistance");
		modelRef = gl.getUniformLocation(shaderProgram, "model");
		viewRef = gl.getUniformLocation(shaderProgram, "view");
		perspectiveRef = gl.getUniformLocation(shaderProgram, "perspective");
		normalTransformRef = gl.getUniformLocation(shaderProgram, "normalTransform");
		aspectRef = gl.getUniformLocation(shaderProgram, "aspect");
		
	}
	
	function highlightVertex(index){
		
		if(highlightedIndex === index){
			return;
		}
		
		for(let e in model.edges){
			
			if(model.edges[e].a == highlightedIndex){
				
				colorData[e*2*3+0] = defaultColor[0];
				colorData[e*2*3+1] = defaultColor[1];
				colorData[e*2*3+2] = defaultColor[2];
				
			}
			
			if(model.edges[e].a == index){
				
				colorData[e*2*3+0] = highlightColor[0];
				colorData[e*2*3+1] = highlightColor[1];
				colorData[e*2*3+2] = highlightColor[2];
				
			}
			
			if(model.edges[e].b == highlightedIndex){
				
				colorData[e*2*3+3] = defaultColor[0];
				colorData[e*2*3+4] = defaultColor[1];
				colorData[e*2*3+5] = defaultColor[2];
				
			}
			
			if(model.edges[e].b == index){
				
				colorData[e*2*3+3] = highlightColor[0];
				colorData[e*2*3+4] = highlightColor[1];
				colorData[e*2*3+5] = highlightColor[2];
				
			}
			
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
		
		highlightedIndex = index;
		
	}

	function addEdges(mdl){
		
		model = mdl;
		
		size = model.edges.length*2;
		
		let vertexData = new Float32Array(size*2*3);
		colorData = new Float32Array(size*2*3);
		
		for(let e in model.edges){
			vertexData[e*2*3+0] = model.points[model.edges[e].a].x;
			vertexData[e*2*3+1] = model.points[model.edges[e].a].y;
			vertexData[e*2*3+2] = model.points[model.edges[e].a].z;
			
			vertexData[e*2*3+3] = model.points[model.edges[e].b].x;
			vertexData[e*2*3+4] = model.points[model.edges[e].b].y;
			vertexData[e*2*3+5] = model.points[model.edges[e].b].z;
			
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

	}
	
	function addTriangles(triangles, normals){
		
		size = triangles.length/3;
		
		let vertexData = new Float32Array(triangles);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		
		var coord = gl.getAttribLocation(shaderProgram, "coordinates");
		gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(coord);
		
		let normalsData = new Float32Array(normals);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normalsData, gl.STATIC_DRAW);
		
		var normal = gl.getAttribLocation(shaderProgram, "vertexNormal");
		gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(normal);
		
		

	}
	
	function render(model, view, perspective){
		
		var normalsMatrix = normalMatrix(model);

		gl.uniform1f(maxDistanceRef, 3.0);
		
		gl.uniformMatrix4fv(modelRef, false, model);
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

		// Draw the triangle
		gl.drawArrays(gl.TRIANGLES, 0, size);
	}
	
	function renderLines(modelMatrix, view, perspective){
		
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

		// Draw the triangle
		gl.drawArrays(gl.LINES, 0, size);
	}

	return{
		addTriangles: addTriangles,
		addEdges: addEdges,
		render: render,
		renderLines: renderLines,
		highlightVertex: highlightVertex,
	};

}