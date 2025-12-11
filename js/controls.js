

function Controls(renderer){
	
	const canvas = document.getElementById("renderCanvas");
	const context = renderer.context;
	
	const contextInfoEl = document.getElementById("contextInfo");

	var position = [0, 0, -1];
	var rotationX = 0;
	var rotationY = 0;
	var currentRotationX = 0;
	var currentRotationY = 0;
	let scale = 1;

	var mouseDown = false;
	var startX = 0;
	var startY = 0;

	var fieldOfViewInRadians = 50/180*Math.PI;
	var aspectRatio = canvas.width/canvas.height;
	var near = 0.001;
	var far = 2;

	var sin = Math.sin;
	var cos = Math.cos;

	update();

	function update(){

		var viewTransforms = [];

		viewTransforms.push([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
		
		viewTransforms.push([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			position[0], position[1], position[2], 1
		]);

		var view = multiplyArrayOfMatrices(viewTransforms);

		var modelTransforms = [[
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]];
		
		/*modelTransforms.push([
			1, 0, 0, position[0],
			0, 1, 0, position[1],
			0, 0, 1, position[2],
			0, 0, 0, 1
		]);*/
		
		var a = rotationY + currentRotationY;
		modelTransforms.push([
			 cos(a),   0, sin(a),   0,
				  0,   1,      0,   0,
			-sin(a),   0, cos(a),   0,
				  0,   0,      0,   1
		]);

		a = rotationX + currentRotationX;
		modelTransforms.push([
			1,       0,        0,     0,
			0,  cos(a),  -sin(a),     0,
			0,  sin(a),   cos(a),     0,
			0,       0,        0,     1
		]);
		
		let scaleTransform = [
			scale, 0, 0, 0,
			0, scale, 0, 0,
			0, 0, scale, 0,
			0, 0, 0, 1
		];
		modelTransforms.push(scaleTransform);
		
		var model = multiplyArrayOfMatrices(modelTransforms);

		var f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
		var rangeInv = 1 / (near - far);

		var perspective = [
			f / aspectRatio, 0,                          0,   0,
			0,               f,                          0,   0,
			0,               0,    (near + far) * rangeInv,  -1,
			0,               0,  near * far * rangeInv * 2,   0
		];


		renderer.render(model, view, perspective);
	}
	
	window.addEventListener("resize", function(event){
		canvas.width = document.getElementById("canvasContainer").clientWidth;
		canvas.height = document.getElementById("canvasContainer").clientHeight;
		aspectRatio = canvas.width/canvas.height;
		
		update();
	});

	canvas.addEventListener("mousedown", function(e){
		startX = e.clientX;
		startY = e.clientY;
		mouseDown = true;
		
		contextInfoEl.style.visibility = "hidden";
		
		e.preventDefault();
	});

	window.addEventListener("mousemove", function(e){
		if(mouseDown){
			var deltaX = startX-e.clientX;
			var deltaY = startY-e.clientY;

			currentRotationY = deltaX/100;
			currentRotationX = deltaY/100;
			
			update();
			
			e.preventDefault();
		} else {
			
		}
	});
	
	canvas.addEventListener("mousemove", function(e){
		
		if(!mouseDown){
			
			//console.log(e);
			
			let x = e.offsetX;
			let y = e.offsetY;
			
			console.log(x, y);
			
			let pixels = new Uint8Array(4);
			
			context.readPixels(x, canvas.height-y, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixels);
			
			console.log(pixels);
			
			let mouseX = e.clientX;
			let mouseY = e.clientY;
			
			//contextInfoEl.style.display = "block";
			
			if(pixels[3] != 0){
				
				let id = pixels[2];
				id += pixels[1]<<8;
				id += pixels[0]<<16;
				
				let type = "";
				
				switch(pixels[3]){
					case 254:
						type = "Corner";
					break;
					
					case 253:
						type = "Edge";
					break;
				};
				
				contextInfoEl.innerHTML = type + " " + id;
				contextInfoEl.style.transform = "translate("+mouseX+"px, "+mouseY+"px)";
				contextInfoEl.style.visibility = "visible";
			
			} else {
				contextInfoEl.style.visibility = "hidden";
			}
			
		}
	});
	
	canvas.addEventListener("mouseenter", function(e){
		
		let x = e.clientX;
		let y = e.clientY;
		
		contextInfoEl.style.visibility = "visible";
		contextInfoEl.style.transform = "translate("+x+"px, "+y+"px)";
	});
	
	canvas.addEventListener("mouseleave", function(e){
		contextInfoEl.style.visibility = "hidden";
	});

	window.addEventListener("mouseup", function(e){
		mouseDown = false;
		rotationX += currentRotationX;
		rotationY += currentRotationY;
		currentRotationX = 0;
		currentRotationY = 0;
		update();
		e.preventDefault();
	});
	
	canvas.addEventListener('wheel', function(e) {
		scale -= scale * 0.001 * e.deltaY;
		update();
		e.preventDefault();
	});


	return {
		update: update,
	};
	
}