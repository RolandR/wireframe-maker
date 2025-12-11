

function Controls(model, renderer){
	
	const canvasContainer = document.getElementById("canvasContainer");
	const canvas = document.getElementById("renderCanvas");
	const context = renderer.context;
	
	const contextInfoEl = document.getElementById("contextInfo");
	
	const cornerDefaultColor = [0.7, 0.4, 0.1];
	const cornerHighlightColor = [1.0, 0.7, 0.0];
	const edgeDefaultColor = [0.5, 0.5, 0.5];
	const edgeHighlightColor = [0.8, 0.77, 0.7];
	const pinDefaultColor = [0.3, 0.3, 0.7];

	var position = [0, 0, -1];
	var rotationX = 0;
	var rotationY = 0;
	var currentRotationX = 0;
	var currentRotationY = 0;
	let scale = 1;

	var mouseDown = false;
	var startX = 0;
	var startY = 0;
	
	let currentlyMousedOver;
	const infoElPaddingX = 5;
	const infoElPaddingY = 15;

	var fieldOfViewInRadians = 50/180*Math.PI;
	var aspectRatio = canvas.width/canvas.height;
	var near = 0.001;
	var far = 2;

	var sin = Math.sin;
	var cos = Math.cos;

	update();

	function update(){
		
		if(canvas.width != canvasContainer.clientWidth
		|| canvas.height != canvasContainer.clientHeight){
			resize();
		}

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
		resize();
	});
	
	function resize(){
		canvas.width = canvasContainer.clientWidth;
		canvas.height = canvasContainer.clientHeight;
		aspectRatio = canvas.width/canvas.height;
		
		renderer.updateSize();
		
		update();
	}

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
	
	function updateMouseover(e, id){
		
		let mouseX = e.clientX;
		let mouseY = e.clientY;
		
		let rect = contextInfoEl.getBoundingClientRect();
		
		const spaceToRight = window.innerWidth - (mouseX + rect.width + infoElPaddingX);
		const spaceToBottom = window.innerHeight - (mouseY + rect.height + infoElPaddingY);
		const spaceToLeft = mouseX - (rect.width + infoElPaddingX);
		const spaceToTop = mouseY - (rect.height + infoElPaddingY);
		
		//console.log(spaceToRight, spaceToBottom, spaceToLeft, spaceToTop);
		
		let posX = mouseX+infoElPaddingX;
		let posY = mouseY+infoElPaddingY;
		
		if(spaceToRight < 0 && spaceToRight < spaceToLeft){
			posX = mouseX - rect.width - infoElPaddingX;
		}
		
		if(spaceToBottom < 0 && spaceToBottom < spaceToTop){
			posY = mouseY - rect.height - infoElPaddingY;
		}
		
		contextInfoEl.style.transform = "translate("+posX+"px, "+posY+"px)";
		
		if(currentlyMousedOver == id || (currentlyMousedOver && currentlyMousedOver.id == id.id && currentlyMousedOver.type == id.type)){
			// we're already showing that
		} else {
			
			currentlyMousedOver = id;
			
			if(id.type != ""){
				
				let obj;
				
				contextInfoEl.innerHTML = "";
				
				if(id.type == "corner"){
					obj = model.points[id.id];
					
					contextInfoEl.innerHTML += "<h3>Corner "+id.id+"</h3>";
					
					let edgesEl = document.createElement("p");
					edgesEl.innerHTML = obj.connections.length;
					edgesEl.innerHTML += " edges: ";
					
					let sortedConnections = obj.connections.toSorted(function(a, b) {
						return parseInt(a.edge.id) - parseInt(b.edge.id);
					});
					
					for(let c in sortedConnections){
						edgesEl.innerHTML += sortedConnections[c].edge.id;
						if(c < sortedConnections.length - 1){
							edgesEl.innerHTML += ", "
						}
					}
					
					contextInfoEl.appendChild(edgesEl);
					
				} else if(id.type == "edge"){
					obj = model.edges[id.id];
					
					contextInfoEl.innerHTML += "<h3>Edge "+id.id+"</h3>";
					
					contextInfoEl.innerHTML += "<p>Length: "
						+(Math.round(obj.pipeLength*10)/10)+" mm"
						+"<br>Connects "+obj.a.id+" and "+obj.b.id+"</p>";
				}
				
				highlight([obj]);
				
				contextInfoEl.style.visibility = "visible";
			
			} else {
				contextInfoEl.style.visibility = "hidden";
				highlight([]);
			}
		}
	}
	
	canvas.addEventListener("mousemove", function(e){
		
		if(!mouseDown){
			
			let x = e.offsetX;
			let y = e.offsetY;
			
			let id = renderer.getIdAtPosition(x, y);
			
			updateMouseover(e, id);
			
		} else {
			currentlyMousedOver = null;
		}
	});
	
	canvas.addEventListener("mouseenter", function(e){
		
		let x = e.offsetX;
		let y = e.offsetY;
		
		let id = renderer.getIdAtPosition(x, y);
		
		updateMouseover(e, id);
		
	});
	
	canvas.addEventListener("mouseleave", function(e){
		contextInfoEl.style.visibility = "hidden";
		currentlyMousedOver = null;
	});

	window.addEventListener("mouseup", function(e){
		mouseDown = false;
		rotationX += currentRotationX;
		rotationY += currentRotationY;
		currentRotationX = 0;
		currentRotationY = 0;
		update();
	});
	
	canvas.addEventListener("mouseup", function(e){
		
		currentlyMousedOver = null;
		
		let x = e.offsetX;
		let y = e.offsetY;
		
		let id = renderer.getIdAtPosition(x, y);
		
		updateMouseover(e, id);
		
		e.preventDefault();
	});
	
	canvas.addEventListener('wheel', function(e) {
		
		scale -= scale * 0.001 * e.deltaY;
		update();
		
		let x = e.offsetX;
		let y = e.offsetY;
		
		let id = renderer.getIdAtPosition(x, y);
		
		updateMouseover(e, id);
		
		e.preventDefault();
	});
	
	function highlight(objects){
		for(let i in model.points){
			model.points[i].previewRender.color = cornerDefaultColor;
		}
		
		for(let i in model.edges){
			model.edges[i].previewRender.color = edgeDefaultColor;
		}
		
		for(let i in objects){
			if(objects[i].type == "corner"){
				objects[i].previewRender.color = cornerHighlightColor;
			} else if(objects[i].type == "edge"){
				objects[i].previewRender.color = edgeHighlightColor;
			}
		}
		
		update();
	}

	return {
		update: update,
		highlight: highlight,
	};
	
}