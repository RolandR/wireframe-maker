
function Renderer(canvasId){

	const canvas = document.getElementById(canvasId);

	canvas.width = document.getElementById("canvasContainer").clientWidth;
	canvas.height = document.getElementById("canvasContainer").clientHeight;
	
	const gl = canvas.getContext("webgl", {preserveDrawingBuffer: true, antialias: true})
	        || canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true, antialias: true});
	        
	//const ext = gl.getExtension("OES_rgb8_rgba8");

	const drawProgram = {};
	const infoProgram = {};
	
	const infoFramebuffer = gl.createFramebuffer();
	const infoRenderbuffer = gl.createRenderbuffer();
	const infoDepthBuffer = gl.createRenderbuffer();
	
	let highlightedIndex = null;
	let highlightColor = [1.0, 0.7, 0.0];
	let defaultColor = [0.5, 0.5, 0.5];
	
	let meshObjects = [];
	
	init();

	function init(){

		gl.enable(gl.DEPTH_TEST);

		
		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertShader, vertexShader);
		gl.compileShader(vertShader);
		
		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragShader, fragmentShader);
		gl.compileShader(fragShader);
		
		const infoFragShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(infoFragShader, infoFragmentShader);
		gl.compileShader(infoFragShader);

		drawProgram.shader = createShaderProgram(vertShader, fragShader);
		
		drawProgram.maxDistanceRef = gl.getUniformLocation(drawProgram.shader, "maxDistance");
		drawProgram.modelRef = gl.getUniformLocation(drawProgram.shader, "model");
		drawProgram.viewRef = gl.getUniformLocation(drawProgram.shader, "view");
		drawProgram.perspectiveRef = gl.getUniformLocation(drawProgram.shader, "perspective");
		drawProgram.normalTransformRef = gl.getUniformLocation(drawProgram.shader, "normalTransform");
		drawProgram.aspectRef = gl.getUniformLocation(drawProgram.shader, "aspect");
		drawProgram.objectColorRef = gl.getUniformLocation(drawProgram.shader, "objectColor");
		
		
		infoProgram.shader = createShaderProgram(vertShader, infoFragShader);
		
		infoProgram.maxDistanceRef = gl.getUniformLocation(infoProgram.shader, "maxDistance");
		infoProgram.modelRef = gl.getUniformLocation(infoProgram.shader, "model");
		infoProgram.viewRef = gl.getUniformLocation(infoProgram.shader, "view");
		infoProgram.perspectiveRef = gl.getUniformLocation(infoProgram.shader, "perspective");
		infoProgram.normalTransformRef = gl.getUniformLocation(infoProgram.shader, "normalTransform");
		infoProgram.aspectRef = gl.getUniformLocation(infoProgram.shader, "aspect");
		infoProgram.idRef = gl.getUniformLocation(infoProgram.shader, "partID");
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, infoFramebuffer);
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, infoRenderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, canvas.width, canvas.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, infoRenderbuffer);
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, infoDepthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, infoDepthBuffer);
		
	}
	
	function createShaderProgram(vertexShader, fragmentShader){
		let program = gl.createProgram();
		gl.attachShader(program, vertexShader); 
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		gl.useProgram(program);
		
		var vertInfo = gl.getShaderInfoLog(vertexShader);
		var fragInfo = gl.getShaderInfoLog(fragmentShader);
		var programInfo = gl.getProgramInfoLog(program);

		if(vertInfo){
			console.info(vertInfo);
		}
		if(fragInfo){
			console.info(fragInfo);
		}
		if(programInfo){
			console.info(programInfo);
		}
		
		return program;
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
				idArray[3] = 15;
			break;
			
			case "edge":
				idArray[3] = 14;
			break;
			
			case "pin":
				idArray[3] = 0;
			break;
			
			default:
				idArray[3] = 0;
			break;
		}
		
		idArray[2] = id%16;
		idArray[1] = (id>>4)%16;
		idArray[0] = (id>>8)%16;
		
		
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
		
		let coord = gl.getAttribLocation(drawProgram.shader, "coordinates");
		gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(coord);
		
		let infoCoord = gl.getAttribLocation(infoProgram.shader, "coordinates");
		gl.vertexAttribPointer(infoCoord, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(infoCoord);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, meshObject.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, meshObject.normalsData, gl.STATIC_DRAW);
		
		let normal = gl.getAttribLocation(drawProgram.shader, "vertexNormal");
		gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(normal);
		
		meshObjects.push(meshObject);
		
		return meshObject;

	}
	
	function render(modelMatrix, view, perspective){
		
		renderVisible(modelMatrix, view, perspective);
		renderInfo(modelMatrix, view, perspective);
		
	}
	
	function renderVisible(modelMatrix, view, perspective){
		
		gl.useProgram(drawProgram.shader);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.enable(gl.SAMPLE_COVERAGE);
		//gl.sampleCoverage(0.5, false);
		
		let normalsMatrix = normalMatrix(modelMatrix);

		gl.uniform1f(drawProgram.maxDistanceRef, 3.0);
		
		gl.uniformMatrix4fv(drawProgram.modelRef, false, modelMatrix);
		gl.uniformMatrix4fv(drawProgram.viewRef, false, view);
		gl.uniformMatrix4fv(drawProgram.perspectiveRef, false, perspective);
		gl.uniformMatrix4fv(drawProgram.normalTransformRef, false, normalsMatrix);
		gl.uniform1f(drawProgram.aspectRef, canvas.width/canvas.height);
		
		for(let i in meshObjects){
			
			let obj = meshObjects[i];
			
			if(!obj.visible){
				continue;
			}
			
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
			let coords = gl.getAttribLocation(drawProgram.shader, "coordinates");
			gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(coords);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalsBuffer);
			let normal = gl.getAttribLocation(drawProgram.shader, "vertexNormal");
			gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(normal);
			
			gl.uniform3fv(drawProgram.objectColorRef, obj.color);
			
			gl.drawArrays(gl.TRIANGLES, 0, obj.size);
			
		}
	}
	
	function renderInfo(modelMatrix, view, perspective){
		
		gl.useProgram(infoProgram.shader);
		gl.bindFramebuffer(gl.FRAMEBUFFER, infoFramebuffer);
		//gl.bindRenderbuffer(gl.RENDERBUFFER, infoRenderbuffer);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.disable(gl.SAMPLE_COVERAGE);
		
		let normalsMatrix = normalMatrix(modelMatrix);

		gl.uniform1f(infoProgram.maxDistanceRef, 3.0);
		
		gl.uniformMatrix4fv(infoProgram.modelRef, false, modelMatrix);
		gl.uniformMatrix4fv(infoProgram.viewRef, false, view);
		gl.uniformMatrix4fv(infoProgram.perspectiveRef, false, perspective);
		gl.uniformMatrix4fv(infoProgram.normalTransformRef, false, normalsMatrix);
		gl.uniform1f(infoProgram.aspectRef, canvas.width/canvas.height);
		
		for(let i in meshObjects){
			
			let obj = meshObjects[i];
			
			if(!obj.visible || obj.idArray[3] == 0){
				continue;
			}
			
			gl.uniform4iv(infoProgram.idRef, obj.idArray);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
			let coords = gl.getAttribLocation(infoProgram.shader, "coordinates");
			gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(coords);
			
			gl.drawArrays(gl.TRIANGLES, 0, obj.size);
			
		}
	}
	
	function getIdAtPosition(x, y){
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, infoFramebuffer);
		
		let pixels = new Uint8Array(4);
		
		gl.readPixels(x, canvas.height-y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		
		let returnId = {
			id: 0,
			type: "",
		};
		
		if(pixels[3] != 0){
			
			returnId.id = pixels[2];
			returnId.id += pixels[1]<<4;
			returnId.id += pixels[0]<<8;
			
			switch(pixels[3]){
				case 15:
					returnId.type = "corner";
				break;
				
				case 14:
					returnId.type = "edge";
				break;
			};
		}
		
		return returnId;
		
	}
	
	function updateSize(){
		gl.bindFramebuffer(gl.FRAMEBUFFER, infoFramebuffer);
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, infoRenderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, canvas.width, canvas.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, infoRenderbuffer);
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, infoDepthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, infoDepthBuffer);
	}

	return{
		addObject: addObject,
		render: render,
		context: gl,
		getIdAtPosition: getIdAtPosition,
		updateSize: updateSize,
	};

}