
function buildCorner(wireframe, index, params){

	let corner = CSG.sphere({
		center: [0, 0, 0],
		radius: params.tubeOD/2,
		slices: 16,
		stacks: 8
	});
	
	let xPos = wireframe.points[index].x;
	let yPos = wireframe.points[index].y;
	let zPos = wireframe.points[index].z;
	
	for(let i in wireframe.points[index].connections){
		
		let other = wireframe.points[wireframe.points[index].connections[i]];
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
		for(let o in wireframe.points[index].connections){
			
			if(o === i){
				continue;
			}
			
			let otherOther = wireframe.points[wireframe.points[index].connections[o]]; // variable names!
			
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
				//unitToX*(calculatedLength+params.margin),
				//unitToY*(calculatedLength+params.margin),
				//unitToZ*(calculatedLength+params.margin),
				unitToX*(i*0.02+0.03),
				unitToY*(i*0.02+0.03),
				unitToZ*(i*0.02+0.03),
			],
			radius: 0.002,
			//radius: params.tubeOD/2,
			slices: 16
		});
		
		corner = corner.union(cylinder);
		
		
		let actualcylinder = CSG.cylinder({
			start: [0, 0, 0],
			end: [
				0,
				0,
				(i*0.02+0.035),
			],
			radius: 0.001,
			//radius: params.tubeOD/2,
			slices: 16
		});
		
		let distanceFromZAxis = Math.sqrt(Math.pow(unitToX, 2) + Math.pow(unitToY, 2));
		let yAngle = Math.asin(distanceFromZAxis)*180/Math.PI;
		if(unitToZ < 0){
			yAngle = 180-yAngle;
		}
		actualcylinder = actualcylinder.rotateY(yAngle);
		
		let zAngle = Math.asin(unitToY)*180/Math.PI;
		actualcylinder = actualcylinder.rotateZ(zAngle);
		
		console.log(unitToX, unitToY, unitToZ);
		console.log(yAngle);
		
		corner = corner.union(actualcylinder);
		
		/*let smallerCylinder = CSG.cylinder({
			start: [unitToX*calculatedLength*0.9, unitToY*calculatedLength*0.9, unitToZ*calculatedLength*0.9],
			end: [
				unitToX*(calculatedLength+params.stickout+params.margin),
				unitToY*(calculatedLength+params.stickout+params.margin),
				unitToZ*(calculatedLength+params.stickout+params.margin)
			],
			radius: params.tubeID/2,
			slices: 16
		});
		
		corner = corner.union(smallerCylinder);*/
	}
	
	return triangulate(corner.toPolygons());
	
}


