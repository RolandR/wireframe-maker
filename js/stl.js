





function generateStl(geometry, displayId){
	
	let exportScale = -1000;
	
	const numTriangles = geometry.triangles.length/9;
	const sizeBytes = 84+(numTriangles*50);
	
	console.log(numTriangles, sizeBytes);
	
	const buffer = new ArrayBuffer(sizeBytes);
	const view = new DataView(buffer);
	
	for(let i = 0; i < 80; i++){
		view.setUint8(i, 0);
	}
	view.setUint32(80, numTriangles, true);
	
	let text = "Wireframe tube holder bit thingy!";
	let utf8Encode = new TextEncoder();
	let textArray = utf8Encode.encode(text);
	for(let i in textArray){
		view.setUint8(i, textArray[i]);
	}
	
	let byteOffset = 84;
	
	for(let t = 0; t < geometry.triangles.length; t += 9){
			
		// Normal vector
		view.setFloat32(byteOffset+0, 0);
		view.setFloat32(byteOffset+4, 0);
		view.setFloat32(byteOffset+8, 0);
		byteOffset += 12;
		// Point C
		view.setFloat32(byteOffset+0, geometry.triangles[t+6]*exportScale, true);
		view.setFloat32(byteOffset+4, geometry.triangles[t+7]*exportScale, true);
		view.setFloat32(byteOffset+8, geometry.triangles[t+8]*exportScale, true);
		byteOffset += 12;
		// Point B
		view.setFloat32(byteOffset+0, geometry.triangles[t+3]*exportScale, true);
		view.setFloat32(byteOffset+4, geometry.triangles[t+4]*exportScale, true);
		view.setFloat32(byteOffset+8, geometry.triangles[t+5]*exportScale, true);
		byteOffset += 12;
		// Point A
		view.setFloat32(byteOffset+0, geometry.triangles[t+0]*exportScale, true);
		view.setFloat32(byteOffset+4, geometry.triangles[t+1]*exportScale, true);
		view.setFloat32(byteOffset+8, geometry.triangles[t+2]*exportScale, true);
		byteOffset += 12;
		// Attribute byte count (always 0)
		view.setUint16(byteOffset, 0);
		byteOffset += 2;
		
	}
	
	console.log("byteOffset: "+byteOffset);
	console.log("calculated: "+numTriangles+" Triangles, "+sizeBytes);
	
	var blob = new Blob([view.buffer], {type: "model/stl"});
    var objectUrl = URL.createObjectURL(blob);
	
	const downloadLink = document.getElementById("downloadLink");
	downloadLink.href = objectUrl;
	downloadLink.download = "corner" + displayId + ".stl";
	downloadLink.style.display = "block";
	
}


function detectBinary(stl){
	stlView = new DataView(stl);
	
	var header = "";
	
	for(var i = 0; i < 80; i++){
		header += String.fromCharCode(stlView.getUint8(i));
	}
	
	var binary = true;
	if(header.match(/^\s*solid/i)){
		binary = false;
	}
	
	if(binary){
		//console.info("Detected binary STL file");
		return parseBinaryStl(stlView);
	} else {
		
		//console.info("Detected ASCII STL file");
		
		var stlString = "";
		
		if("TextDecoder" in window){
			var enc = new TextDecoder("utf-8");
			stlString = enc.decode(stlView);
		} else {
			console.warning("TextDecoder not supported, falling back to Array.reduce and String.fromCharCode...");
			var arr = new Uint8Array(stl);
			stlString = arr.reduce(function(str, charIndex) {
				return str + String.fromCharCode(charIndex);
			});
		}
		
		return parseAsciiStl(stlString);
	}
}


function parseBinaryStl(stl){
	
	var length = stl.getUint32(80, true);
	
	var normals = [];
	var vertices = new Float32Array(length*3*3);
	
	var byteOffset = 84;
	var vert = 0;
	var norm = 0;
	
	for(var i = 0; i < length; i++){
		var n = [];
		for(var b = 0; b < 3; b++){
			n.push(stl.getFloat32(byteOffset, true));
			byteOffset += 4;
		}
		normals.push(n[0], n[1], n[2]);
		normals.push(n[0], n[1], n[2]);
		normals.push(n[0], n[1], n[2]);
		
		for(var a = 0; a < 3; a++){
			for(var v = 0; v < 3; v++){
				vertices[vert] = stl.getFloat32(byteOffset, true);
				byteOffset += 4;
				vert++;
			}
		}
		
		byteOffset += 2;
	}
	
	normals = Float32Array.from(normals);
	
	return {
		vertices: vertices,
		normals: normals,
	};
}

function parseAsciiStl(stl){
	var lines = stl.split("\n");
	
	for(var i = 0; i < lines.length; i++){
		lines[i] = lines[i].trim().split(/\s+/);
	}
	
	var normals = [];
	var vertices = [];
	
	var i = 0;
	while(i < lines.length){
		
		if(lines[i][0] == "facet"){
			var three = 3;
			while(three--){
				normals.push(lines[i][2], lines[i][3], lines[i][4]);
			}
			
			i += 2;
			
			var three = 3;
			while(three--){
				vertices.push(lines[i][1], lines[i][2], lines[i][3]);
				i++;
			}
			
		} else {
			i++;
		}
	}
	
	for(var i = 0; i < vertices.length; i++){
		vertices[i] = parseFloat(vertices[i].trim());
	}
	
	for(var i = 0; i < normals.length; i++){
		normals[i] = parseFloat(normals[i].trim());
	}
	
	vertices = Float32Array.from(vertices);
	normals = Float32Array.from(normals);
	
	return {
		vertices: vertices,
		normals: normals,
	};
}