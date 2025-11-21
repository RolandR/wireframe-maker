
function buildCorner(wireframe, index, params, letterShapes){

	let corner = CSG.sphere({
		center: [0, 0, 0],
		radius: (params.tubeOD/2)*1.01,
		resolution: 32,
	});
	
	let point = wireframe.points[index];
	
	let xPos = point.x;
	let yPos = point.y;
	let zPos = point.z;
	
	let hollowCylinders = [];
	
	for(let i in point.connections){

		let edge = point.connections[i].edge;
		let other = point.connections[i].point;
		
		let toX = other.x - xPos;
		let toY = other.y - yPos;
		let toZ = other.z - zPos;
		
		let distance = Math.sqrt(
			Math.pow(toX, 2) +
			Math.pow(toY, 2) +
			Math.pow(toZ, 2)
		);
		
		let stickout = 0.03;
		
		unitToX = toX/distance;
		unitToY = toY/distance;
		unitToZ = toZ/distance;
		
		let maxDotProduct = 0;
		// calculate angles to other edges
		for(let o in point.connections){
			
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
		
		i = parseInt(i);
		
		let smallestAngle = Math.acos(maxDotProduct);
		
		let calculatedLength = params.tubeOD/2 * (1/Math.tan(smallestAngle/2));
		
		let cylinder = CSG.cylinder({
			start: [0, 0, 0],
			end: [
				0,
				0,
				calculatedLength+params.margin,
			],
			radius: params.tubeOD/2,
			resolution: 32
		});
		
		let distanceFromZAxis = Math.sqrt(Math.pow(unitToX, 2) + Math.pow(unitToY, 2));
		let yAngle = Math.asin(distanceFromZAxis)*180/Math.PI;
		if(unitToZ < 0){
			yAngle = 180-yAngle;
		}
		cylinder = cylinder.rotateY(yAngle);
		
		
		let zAngle = Math.asin(unitToY/distanceFromZAxis)*180/Math.PI;
		if(unitToX < 0){
			zAngle = 180-zAngle;
		}
		cylinder = cylinder.rotateZ(zAngle);
		
		corner = corner.union(cylinder);
		
		let smallerCylinder = CSG.cylinder({
			start: [0, 0, calculatedLength],
			end: [
				0,
				0,
				calculatedLength+params.stickout+params.margin,
			],
			radius: params.tubeID/2,
			resolution: 32,
		});
		
		let textMargin = 0.001;
		
		let idText = setText(index + "");
		idText.letters = idText.letters.scale([1, 1, 0.5]);
		
		if(idText.width+2*textMargin > params.stickout){
			let factor = (params.stickout)/(idText.width+2*textMargin);
			idText.letters = idText.letters.scale([factor, factor, 1]);
		}
		
		idText = idText.letters
			.rotateX(90)
			.rotateY(90)
			.translate([0, params.tubeID/2, calculatedLength+params.stickout+params.margin-textMargin]);
			
		
		console.log(edge);
		let edgeText = setText(edge.id + "");
		edgeText.letters = edgeText.letters.scale([1, 1, 0.5]);
		
		if(edgeText.width+2*textMargin > params.stickout){
			let factor = (params.stickout)/(edgeText.width+2*textMargin);
			edgeText.letters = edgeText.letters.scale([factor, factor, 1]);
		}
		
		edgeText = edgeText.letters
			.rotateX(90)
			.rotateY(90)
			.translate([0, params.tubeID/2, calculatedLength+params.stickout+params.margin-textMargin]);
			
			
		smallerCylinder = smallerCylinder.subtract(idText);
		smallerCylinder = smallerCylinder.subtract(idText.rotateZ(120));
		smallerCylinder = smallerCylinder.subtract(idText.rotateZ(240));
		
		smallerCylinder = smallerCylinder.subtract(edgeText.rotateZ(30));
		smallerCylinder = smallerCylinder.subtract(edgeText.rotateZ(120+30));
		smallerCylinder = smallerCylinder.subtract(edgeText.rotateZ(240+30));
		
		smallerCylinder = smallerCylinder.rotateY(yAngle);
		smallerCylinder = smallerCylinder.rotateZ(zAngle);
		
		corner = corner.union(smallerCylinder);
		
		let hollowCylinder = CSG.cylinder({
			start: [0, 0, 0],
			end: [
				0,
				0,
				calculatedLength+params.stickout+params.margin*2,
			],
			radius: params.hollowDiameter/2,
			resolution: 8,
		});
		hollowCylinder = hollowCylinder.rotateY(yAngle);
		hollowCylinder = hollowCylinder.rotateZ(zAngle);
		hollowCylinders.push(hollowCylinder);
	}
	
	let hollowCenter = CSG.sphere({
		center: [0, 0, 0],
		radius: (params.hollowDiameter/2)*1.01,
		resolution: 8,
	});
	corner = corner.subtract(hollowCenter);
	
	for(let i in hollowCylinders){
		corner = corner.subtract(hollowCylinders[i]);
	}
	
	console.log(corner);
	
	return triangulate(corner.toPolygons());
	
}


function setText(text){
	
	const letterWidth = 0.003;
	const letterHeight = 0.004;
	
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