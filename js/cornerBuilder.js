

let previewResolution = 16;

let baseSphere = CSG.sphere({
	center: [0, 0, 0],
	radius: (params.tubeOD/2)*1.01,
	resolution: previewResolution,
});

let baseCylinder = CSG.cylinder({
	start: [0, 0, 0],
	end: [
		0,
		0,
		1
	],
	radius: params.tubeOD/2,
	resolution: previewResolution,
});

let pinResolution = Math.max(3, Math.round(previewResolution/2));
let basePin = CSG.cylinder({
	start: [-params.tubeOD*0.7, 0, 0],
	end: [params.tubeOD*0.7, 0, 0],
	radius: (params.pinHoleDiameter)/2,
	resolution: pinResolution,
});

function calculateCorner(wireframe, index, params){
	
	let point = wireframe.points[index];
	
	let xPos = point.x;
	let yPos = point.y;
	let zPos = point.z;
	
	for(let i in point.connections){
		i = parseInt(i);

		let connection = point.connections[i];
		let edge = connection.edge;
		let other = connection.point;
		
		let toX = other.x - xPos;
		let toY = other.y - yPos;
		let toZ = other.z - zPos;
		
		let distance = Math.sqrt(
			Math.pow(toX, 2) +
			Math.pow(toY, 2) +
			Math.pow(toZ, 2)
		);
		
		unitToX = toX/distance;
		unitToY = toY/distance;
		unitToZ = toZ/distance;
		
		let maxDotProduct = 0;
		
		// calculate angles to other edges
		for(let o in point.connections){
			o = parseInt(o);
			
			if(o === i){
				continue;
			}
			
			let otherOther = point.connections[o].point; // variable names!
			
			let toOtherX = otherOther.x - xPos;
			let toOtherY = otherOther.y - yPos;
			let toOtherZ = otherOther.z - zPos;
			
			let otherOtherDistance = Math.sqrt(
				Math.pow(toOtherX, 2) +
				Math.pow(toOtherY, 2) +
				Math.pow(toOtherZ, 2)
			);
			
			unitOtherX = toOtherX/otherOtherDistance;
			unitOtherY = toOtherY/otherOtherDistance;
			unitOtherZ = toOtherZ/otherOtherDistance;
			
			let dotProduct = unitToX*unitOtherX + unitToY*unitOtherY + unitToZ*unitOtherZ;
			
			maxDotProduct = Math.max(dotProduct, maxDotProduct);
			
		}
		
		let smallestAngle = Math.acos(maxDotProduct);
		
		let calculatedLength = params.tubeOD/2 * (1/Math.tan(smallestAngle/2));
		
		if(calculatedLength == Infinity){
			console.error("Two edges are parallel at point "+point.id+", which is impossible to model!");
			calculatedLength = 1;
		}
		
		connection.stickout = calculatedLength+params.margin;
		
		let distanceFromZAxis = Math.sqrt(Math.pow(unitToX, 2) + Math.pow(unitToY, 2));
		let yAngle = Math.asin(distanceFromZAxis)*180/Math.PI;
		if(unitToZ < 0){
			yAngle = 180-yAngle;
		}
		
		connection.yAngle = yAngle;
		
		let zAngle = 0;
		if(distanceFromZAxis != 0){
			zAngle = Math.asin(unitToY/distanceFromZAxis)*180/Math.PI;
		}
		if(unitToX < 0){
			zAngle = 180-zAngle;
		}
		
		connection.zAngle = zAngle;
		

		
		// calculate pin angle
		
		let pinToX = edge.normal.x;
		let pinToY = edge.normal.y;
		let pinToZ = edge.normal.z;
		
		let reverseYAngle = (((-connection.yAngle)*Math.PI)/180);
		let reverseZAngle = (((-connection.zAngle)*Math.PI)/180);
		
		let newX = pinToX*Math.cos(reverseZAngle) - pinToY*Math.sin(reverseZAngle);
		let newY = pinToX*Math.sin(reverseZAngle) + pinToY*Math.cos(reverseZAngle);
		let newZ = pinToZ;
		
		let rotatedX = newX*Math.cos(reverseYAngle) + newZ*Math.sin(reverseYAngle);
		let rotatedY = newY;
		let rotatedZ = -newX*Math.sin(reverseYAngle) + newZ*Math.cos(reverseYAngle);
		
		// floating point errors can sometimes cause rotatedY to become a smidge longer than 1
		if(rotatedY > 1){
			rotatedY = 1;
		} else if(rotatedY < -1){
			rotatedY = -1;
		}
		
		let pinZAngle = Math.asin(rotatedY)*180/Math.PI;
		if(rotatedX < 0){
			pinZAngle = 180-pinZAngle;
		}
		
		connection.pinZAngle = pinZAngle;
		
	}
	
}


// calculateEdges can only be done after calculateCorner has been run for all corners
function calculateEdge(wireframe, index, params){

	let edge = wireframe.edges[index];
	
	edge.distanceA = edge.connectionA.stickout + params.connectorToPipeMargin;
	edge.yAngle = edge.connectionA.yAngle;
	edge.zAngle = edge.connectionA.zAngle;
	edge.distanceB = edge.connectionB.stickout + params.connectorToPipeMargin;
	
	edge.pipeLength = edge.edgeLength - (edge.distanceA + edge.distanceB);
	
	if(edge.pipeLength < 0){
		console.error("The edge connecting corners "+edge.a.id+" and "+edge.b.id+" ends up too short, because another edge connects at too shallow an angle!");
		edge.pipeLength = 1;
	}
	
}

function buildEdgePreview(wireframe, index, params){
	
	let edge = wireframe.edges[index];
	let xPos = edge.a.x;
	let yPos = edge.a.y;
	let zPos = edge.a.z;
	
	let cylinder = baseCylinder.scale([1, 1, edge.pipeLength]);
	cylinder = cylinder.translate([0, 0, edge.distanceA]);
	cylinder = cylinder.rotateY(edge.yAngle);
	cylinder = cylinder.rotateZ(edge.zAngle);
	cylinder = cylinder.translate([xPos, yPos, zPos]);
	
	return triangulate(cylinder.toPolygons());
	
}

function buildPinsPreview(wireframe, index, params){
	
	let point = wireframe.points[index];
	
	let xPos = point.x;
	let yPos = point.y;
	let zPos = point.z;
	
	let pins = [];
	
	for(let i in point.connections){
		
		let connection = point.connections[i];
		let edge = connection.edge;
		let other = connection.point;
		
		let edgeDirection = normaliseVec3({
			x: other.x - xPos,
			y: other.y - yPos,
			z: other.z - zPos,
		});
		
		let pinPosition = connection.stickout + params.stickout/2;
		
		let pin = basePin.rotateZ(connection.pinZAngle);
		pin = pin.rotateY(connection.yAngle);
		pin = pin.rotateZ(connection.zAngle);
		pin = pin.translate([
			xPos+pinPosition*edgeDirection.x,
			yPos+pinPosition*edgeDirection.y, 
			zPos+pinPosition*edgeDirection.z,
		]);
		
		pins.push(pin);
	}
	
	let triangles = [];
	let normals = [];
	
	for(let i in pins){
		
		let polygons = triangulate(pins[i].toPolygons());
		triangles = triangles.concat(polygons.triangles);
		normals = normals.concat(polygons.normals);
		
	}
	
	return {
		triangles: triangles,
		normals: normals,
	};
	
}


function buildCornerPreview(wireframe, index, params){
	
	let point = wireframe.points[index];
	
	let xPos = point.x;
	let yPos = point.y;
	let zPos = point.z;
	
	let cornerParts = [];
	
	let corner = baseSphere.translate([xPos, yPos, zPos]);
	
	cornerParts.push(corner);
	
	for(let i in point.connections){
		
		let connection = point.connections[i];
		let edge = connection.edge;
		let other = connection.point;
		
		let cylinder = baseCylinder.scale([1, 1, connection.stickout]);
		cylinder = cylinder.rotateY(connection.yAngle);
		cylinder = cylinder.rotateZ(connection.zAngle);
		cylinder = cylinder.translate([xPos, yPos, zPos]);
		
		cornerParts.push(cylinder);
		
	}
	
	
	let triangles = [];
	let normals = [];
	
	for(let i in cornerParts){
		
		let polygons = triangulate(cornerParts[i].toPolygons());
		triangles = triangles.concat(polygons.triangles);
		normals = normals.concat(polygons.normals);
		
	}
	
	return {
		triangles: triangles,
		normals: normals,
	};
	
}


async function buildCorner(wireframe, index, params, letterShapes, cornerPMon){
	
	let point = wireframe.points[index];
	
	await cornerPMon.postMessage("Building edge connectors...", "info", point.connections.length);
	await cornerPMon.updateCount(0);
	
	let corner = CSG.sphere({
		center: [0, 0, 0],
		radius: (params.tubeOD/2)*1.01,
		resolution: params.outsideResolution,
	});
	
	let xPos = point.x;
	let yPos = point.y;
	let zPos = point.z;
	
	let hollowCylinders = [];
	
	for(let i in point.connections){
		
		i = parseInt(i);
		
		let connection = point.connections[i];
		let edge = connection.edge;
		let other = connection.point;
		
		let pinPosition = connection.stickout + params.stickout/2;
		
		let cylinder = CSG.cylinder({
			start: [0, 0, 0],
			end: [
				0,
				0,
				connection.stickout,
			],
			radius: params.tubeOD/2,
			resolution: params.outsideResolution,
		});
		
		let smallerCylinder = CSG.cylinder({
			start: [0, 0, connection.stickout],
			end: [
				0,
				0,
				connection.stickout + params.stickout,
			],
			radius: params.tubeID/2,
			resolution: params.outsideResolution,
		});
		
		// cylinder to fill up text from the inside
		// and size the thread insert stabiliser
		
		let textDepthCylinder = CSG.cylinder({
			start: [0, 0, connection.stickout],
			end: [
				0,
				0,
				connection.stickout + params.stickout,
			],
			radius: params.tubeID/2-params.textDepth,
			resolution: params.outsideResolution,
		});
		
		// Text
		
		let idText = setText(index + "");
		idText.letters = idText.letters.scale([1, 1, 5]);
		
		if(idText.width+2*params.textMargin > params.stickout){
			let factor = (params.stickout)/(idText.width+2*params.textMargin);
			idText.letters = idText.letters.scale([factor, factor, 1]);
		}
			
		let edgeText = setText(edge.id + "");
		edgeText.letters = edgeText.letters.scale([1, 1, 5]);
		
		if(edgeText.width+2*params.textMargin > params.stickout){
			let factor = (params.stickout)/(edgeText.width+2*params.textMargin);
			edgeText.letters = edgeText.letters.scale([factor, factor, 1]);
		}
		
		idText = idText.letters
			.rotateX(90)
			.rotateY(90)
			.translate([0, params.tubeID/2, 0]);
			
		edgeText = edgeText.letters
			.rotateX(90)
			.rotateY(90)
			.translate([0, params.tubeID/2, 0]);
		
		idText = idText.translate([0, 0, connection.stickout+params.stickout-params.textMargin]);
		edgeText = edgeText.translate([0, 0, connection.stickout+params.stickout-params.textMargin]);
			
			
		const textSeparationHalfAngle = 31;
		
		smallerCylinder = smallerCylinder.subtract(idText.rotateZ(connection.pinZAngle-textSeparationHalfAngle));
		smallerCylinder = smallerCylinder.subtract(idText.rotateZ(connection.pinZAngle+180-textSeparationHalfAngle));
		
		smallerCylinder = smallerCylinder.subtract(edgeText.rotateZ(connection.pinZAngle+textSeparationHalfAngle));
		smallerCylinder = smallerCylinder.subtract(edgeText.rotateZ(connection.pinZAngle+180+textSeparationHalfAngle));
		
		smallerCylinder = smallerCylinder.union(textDepthCylinder);
		
		
		// cut hollow the smaller cylinder end part
		// (we need to do this now to allow for the thread insert support)
		
		let smallHollowCylinder = CSG.cylinder({
			start: [0, 0, connection.stickout],
			end: [
				0,
				0,
				connection.stickout + params.stickout,
			],
			radius: params.hollowDiameter/2,
			resolution: params.insideResolution,
		});
		
		
		smallerCylinder = smallerCylinder.subtract(smallHollowCylinder);
		
		
		// Hot melt thread insert support
		
		let insertSupport = CSG.cube({
			center: [
				params.tubeID/2 - params.meltInsertLength/2,
				0,
				pinPosition,
			],
			radius: [params.meltInsertLength/2, params.tubeID/2, params.meltInsertSupportWidth/2],
		});
		
		insertSupport = insertSupport.rotateZ(connection.pinZAngle+180);
		insertSupport = insertSupport.intersect(textDepthCylinder);
		
		smallerCylinder = smallerCylinder.union(insertSupport);
		
		// cut out hole for pin
		
		let pinhole = CSG.cylinder({
			start: [-params.tubeOD*0.51, 0, 0],
			end: [
				params.tubeOD*0.51,
				0,
				0,
			],
			radius: params.pinHoleDiameter/2,
			resolution: previewResolution,
		});
		
		pinhole = pinhole.rotateZ(connection.pinZAngle);
		pinhole = pinhole.translate([0, 0, pinPosition]);
		
		smallerCylinder = smallerCylinder.subtract(pinhole);
		
		/////////////////////////
		
		
		cylinder = cylinder.union(smallerCylinder);
		cylinder = cylinder.rotateY(connection.yAngle);
		cylinder = cylinder.rotateZ(connection.zAngle);
		
		corner = corner.union(cylinder);
		
		let hollowCylinder = CSG.cylinder({
			start: [0, 0, 0],
			end: [
				0,
				0,
				connection.stickout,
			],
			radius: params.hollowDiameter/2,
			resolution: params.insideResolution,
		});
		hollowCylinder = hollowCylinder.rotateY(connection.yAngle);
		hollowCylinder = hollowCylinder.rotateZ(connection.zAngle);
		hollowCylinders.push(hollowCylinder);
		
		await cornerPMon.updateCount(i+1);
	}
	
	await cornerPMon.updateProgress(1);
	await cornerPMon.finishItem();
	await cornerPMon.postMessage("Cutting hollow...", "info", hollowCylinders.length);
	await cornerPMon.updateCount(0);
	
	let hollowCenter = CSG.sphere({
		center: [0, 0, 0],
		radius: (params.hollowDiameter/2)*1.01,
		resolution: params.insideResolution,
	});
	corner = corner.subtract(hollowCenter);
	
	for(let i in hollowCylinders){
		corner = corner.subtract(hollowCylinders[i]);
		
		i = parseInt(i);
		await cornerPMon.updateCount(i+1);
	}
	
	await cornerPMon.updateProgress(1);
	await cornerPMon.finishItem();
	
	return triangulate(corner.toPolygons());
	
}


function setText(text){
	
	const letterHeight = params.textSize;
	const letterWidth = letterHeight*0.75;
	
	let letters = [];
	for(let i in text){
		let letter = text[i];
		
		if(letterShapes.hasOwnProperty(letter)){
			let letterShape = letterShapes[letter]
				.scale(letterHeight)
				.translate([i*letterWidth+letterWidth/2, 0, 0]);
			
			letters.push(letterShape);
		}
	}
	
	let combinedLetters = letters[0];
	
	for(let i = 1; i < letters.length; i++){
		combinedLetters = combinedLetters.union(letters[i]);
	}
	
	let textWidth = text.length*letterWidth;
	let textHeight = letterHeight;
	
	return {
		letters: combinedLetters,
		width: textWidth,
		height: textHeight,
	};
	
}


//.rotateX(90)
//.rotateY(90)
//.translate([0, params.tubeID/2, calculatedLength+params.stickout+params.margin])