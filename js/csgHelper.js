

function calculateNormalVector(vertices){
	let normal = {
		x: 0,
		y: 0,
		z: 0,
	};
	
	let a = {
		x: vertices[1].pos.x - vertices[0].pos.x,
		y: vertices[1].pos.y - vertices[0].pos.y,
		z: vertices[1].pos.z - vertices[0].pos.z,
	};
	
	let b = {
		x: vertices[2].pos.x - vertices[0].pos.x,
		y: vertices[2].pos.y - vertices[0].pos.y,
		z: vertices[2].pos.z - vertices[0].pos.z,
	};
	
	normal.x = a.y*b.z - a.z*b.y;
	normal.y = a.z*b.x - a.x*b.z;
	normal.z = a.x*b.y - a.y*b.x;
	
	let normalLength = Math.sqrt(
		Math.pow(normal.x, 2) +
		Math.pow(normal.y, 2) +
		Math.pow(normal.z, 2)
	);
	
	normal.x = normal.x/normalLength;
	normal.y = normal.y/normalLength;
	normal.z = normal.z/normalLength;
	
	return normal;
}

function triangulate(csgPolygons){
	
	// this only works for convex, flat polygons
	// but csg.js should only generate those
	// (i hope)
	
	let triangles = [];
	let normals = [];
	
	for(let p in csgPolygons){
		
		if(csgPolygons[p].vertices.length === 3){
			
			let normal = calculateNormalVector(csgPolygons[p].vertices);
			
			for(let v in csgPolygons[p].vertices){
				triangles.push(csgPolygons[p].vertices[v].pos.x);
				triangles.push(csgPolygons[p].vertices[v].pos.y);
				triangles.push(csgPolygons[p].vertices[v].pos.z);
				
				normals.push(normal.x);
				normals.push(normal.y);
				normals.push(normal.z);
			}
		} else {
			for(let t = 2; t < csgPolygons[p].vertices.length; t++){
				
				let normal = calculateNormalVector([
					csgPolygons[p].vertices[0],
					csgPolygons[p].vertices[t-1],
					csgPolygons[p].vertices[t],
				]);
				
				triangles.push(csgPolygons[p].vertices[0].pos.x);
				triangles.push(csgPolygons[p].vertices[0].pos.y);
				triangles.push(csgPolygons[p].vertices[0].pos.z);
				
				triangles.push(csgPolygons[p].vertices[t-1].pos.x);
				triangles.push(csgPolygons[p].vertices[t-1].pos.y);
				triangles.push(csgPolygons[p].vertices[t-1].pos.z);
				
				triangles.push(csgPolygons[p].vertices[t].pos.x);
				triangles.push(csgPolygons[p].vertices[t].pos.y);
				triangles.push(csgPolygons[p].vertices[t].pos.z);
				
				
				normals.push(normal.x);
				normals.push(normal.y);
				normals.push(normal.z);
				
				normals.push(normal.x);
				normals.push(normal.y);
				normals.push(normal.z);
				
				normals.push(normal.x);
				normals.push(normal.y);
				normals.push(normal.z);
			}
		}
		
	}
	
	return {
		triangles: triangles,
		normals: normals,
	};
	
}