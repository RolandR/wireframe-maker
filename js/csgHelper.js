

function triangulate(csgPolygons){
	
	// this only works for convex, flat polygons
	// but csg.js should only generate those
	// (i hope)
	
	let triangles = [];
	let normals = [];
	
	for(let p in csgPolygons){
		
		if(csgPolygons[p].vertices.length === 3){
			for(let v in csgPolygons[p].vertices){
				triangles.push(csgPolygons[p].vertices[v].pos.x);
				triangles.push(csgPolygons[p].vertices[v].pos.y);
				triangles.push(csgPolygons[p].vertices[v].pos.z);
				
				normals.push(csgPolygons[p].vertices[v].normal.x);
				normals.push(csgPolygons[p].vertices[v].normal.y);
				normals.push(csgPolygons[p].vertices[v].normal.z);
			}
		} else {
			for(let t = 2; t < csgPolygons[p].vertices.length; t++){
				triangles.push(csgPolygons[p].vertices[0].pos.x);
				triangles.push(csgPolygons[p].vertices[0].pos.y);
				triangles.push(csgPolygons[p].vertices[0].pos.z);
				
				triangles.push(csgPolygons[p].vertices[t-1].pos.x);
				triangles.push(csgPolygons[p].vertices[t-1].pos.y);
				triangles.push(csgPolygons[p].vertices[t-1].pos.z);
				
				triangles.push(csgPolygons[p].vertices[t].pos.x);
				triangles.push(csgPolygons[p].vertices[t].pos.y);
				triangles.push(csgPolygons[p].vertices[t].pos.z);
				
				
				
				normals.push(csgPolygons[p].vertices[0].normal.x);
				normals.push(csgPolygons[p].vertices[0].normal.y);
				normals.push(csgPolygons[p].vertices[0].normal.z);
				
				normals.push(csgPolygons[p].vertices[t-1].normal.x);
				normals.push(csgPolygons[p].vertices[t-1].normal.y);
				normals.push(csgPolygons[p].vertices[t-1].normal.z);
				
				normals.push(csgPolygons[p].vertices[t].normal.x);
				normals.push(csgPolygons[p].vertices[t].normal.y);
				normals.push(csgPolygons[p].vertices[t].normal.z);
			}
		}
		
	}
	
	return {
		triangles: triangles,
		normals: normals,
	};
	
}