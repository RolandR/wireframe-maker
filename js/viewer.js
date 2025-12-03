
const params = {
	tubeOD: 0.02,
	tubeID: 0.0167,
	stickout: 0.015,
	margin: 0.001,
	hollowDiameter: 0.0125,
	pinHoleDiameter: 0.002,
	connectorToPipeMargin: 0.001,
	outsideResolution: 32,
	insideResolution: 16,
	textMargin: 0.003,
	textDepth: 0.0005,
}

let model = {};

let cornerDefaultColor = [0.7, 0.4, 0.1];
let cornerHighlightColor = [1.0, 0.7, 0.0];
let edgeDefaultColor = [0.5, 0.5, 0.5];
let edgeHighlightColor = [0.8, 0.77, 0.7];
let pinDefaultColor = [0.3, 0.3, 0.7];

const renderer = new Renderer("renderCanvas");
var controls;

const fileInput = document.getElementById("file");
const fileInfoContainer = document.getElementById("fileInfoContainer");
const triangleCountEl = document.getElementById("triangleCount");
const edgeCountEl = document.getElementById("edgeCount");
const vertexCountEl = document.getElementById("vertexCount");
const pipeLengthEl = document.getElementById("pipeLength");

const verticesContainer = document.getElementById("verticesContainer");
const edgesContainer = document.getElementById("edgesContainer");

let letterShapes = {};

loadAlphabet();

async function loadAlphabet(){
	
	for(let i = 0; i <= 9; i++){
		let url = "./models/numbers/number"+i+".stl";
		
		letterShapes[i] = await loadShape(url);
		
	}
	
}


const pMon = new ProgressMonitor(document.body, {
	itemsCount: 5,
	title: "Loading file..."
});

fileInput.onchange = function(e){
	e.preventDefault();
	
	loadFile(fileInput.files[0]);
	
}

/*var file = "./stl/l6.stl";

loadFile(file, function(response){
	detectBinary(response);
});*/

async function loadFile(file){
	
	const reader = new FileReader();
	
	await pMon.start();
	await pMon.postMessage("Loading file from disk...");
	
	reader.addEventListener("progress", function(e){
		let progress = e.loaded/e.total;
		pMon.updateProgress(progress);
	});
	
	let readFile = new Promise((resolve, reject) => {
		reader.onload = function(){
			resolve(reader.result);
		};
	});
	
	reader.readAsArrayBuffer(file);
	
	let loadedFile = await readFile;
	
	await pMon.updateProgress(1);
	await pMon.finishItem();
	await pMon.postMessage("Processing file...");
	
	let parsedData = detectBinary(loadedFile);
	
	model = process3dData(parsedData);
	
	triangleCountEl.innerHTML = model.triangles.length;
	edgeCountEl.innerHTML = model.edges.length;
	vertexCountEl.innerHTML = model.points.length;
	fileInfoContainer.style.display = "block";
	
	await pMon.updateProgress(1);
	await pMon.finishItem();
	await pMon.postMessage("Calculating edges...", "info", model.points.length);
	
	for(let p in model.points){
		p = parseInt(p);
		
		calculateCorner(model, p, params);
		
		await pMon.updateCount(p+1);
	}
	
	let totalPipeLength = 0;
	
	for(let e in model.edges){
		e = parseInt(e);
		
		calculateEdge(model, e, params);
		
		totalPipeLength += model.edges[e].pipeLength;
		
	}
	
	pipeLengthEl.innerHTML = totalPipeLength.toFixed(2) + " m";
	
	
	model.edges.sort(function(a, b) {
		// sort edges by length
		return a.pipeLength - b.pipeLength;
	});
	
	for(let e in model.edges){
		model.edges[e].id = e;
	}
	
	await pMon.updateProgress(1);
	await pMon.finishItem();
	await pMon.postMessage("Building preview corners...", "info", model.points.length);
	
	for(let p in model.points){
		p = parseInt(p);
		
		let cornerPreview = buildCornerPreview(model, p, params);
		
		model.points[p].previewRender = renderer.addObject(cornerPreview.triangles, cornerPreview.normals, cornerDefaultColor);
		
		let pinsPreview = buildPinsPreview(model, p, params);
		
		model.points[p].previewPinsRender = renderer.addObject(pinsPreview.triangles, pinsPreview.normals, pinDefaultColor);
		
		await pMon.updateCount(p+1);
	}
	
	
	
	
	for(let p in model.points){
		p = parseInt(p);
		
		let pointInfoEl = document.createElement("div");
		pointInfoEl.className = "pointInfo";
		
		pointInfoEl.innerHTML += "<h3>Corner "+p+"</h3>";
		
		let edgesEl = document.createElement("p");
		edgesEl.innerHTML = model.points[p].connections.length;
		edgesEl.innerHTML += " edges: ";
		
		let sortedConnections = model.points[p].connections.toSorted(function(a, b) {
			return parseInt(a.edge.id) - parseInt(b.edge.id);
		});
		
		for(let c in sortedConnections){
			edgesEl.innerHTML += sortedConnections[c].edge.id;
			if(c < sortedConnections.length - 1){
				edgesEl.innerHTML += ", "
			}
		}
		
		pointInfoEl.appendChild(edgesEl);
		
		pointInfoEl.addEventListener("click", async function(e){
			
			let pointInfoElements = document.getElementsByClassName("pointInfo");
			for(let el in pointInfoElements){
				pointInfoElements[el].className = "pointInfo";
			}
			
			pointInfoEl.className = "pointInfo pointInfoActive";
			
			await buildAndShowCorner(p);
			
		});
		
		pointInfoEl.addEventListener("mouseenter", function(e){
			
			for(let i in model.points){
				model.points[i].previewRender.color = cornerDefaultColor;
			}
			
			for(let i in model.edges){
				model.edges[i].previewRender.color = edgeDefaultColor;
			}
			
			model.points[p].previewRender.color = cornerHighlightColor;
			
			for(let i in model.points[p].connections){
				model.points[p].connections[i].edge.previewRender.color = edgeHighlightColor;
			}
			
			controls.update();
			
		});
		
		verticesContainer.appendChild(pointInfoEl);
		
	}
	
	verticesContainer.style.display = "block";
	
	await pMon.updateProgress(1);
	await pMon.finishItem();
	await pMon.postMessage("Building preview edges...", "info", model.edges.length);
	
	for(let e in model.edges){
		e = parseInt(e);
		
		let edgeInfoEl = document.createElement("div");
		edgeInfoEl.className = "edgeInfo";
		
		edgeInfoEl.innerHTML += "<h3>Edge "+e+"</h3>";
		
		edgeInfoEl.innerHTML += "<p>Length: "+(Math.round(model.edges[e].pipeLength*10000)/10)+" mm"
			+" | connects "+model.edges[e].a.id+" and "+model.edges[e].b.id+"</p>";
		
		edgeInfoEl.addEventListener("mouseenter", function(event){
			
			for(let i in model.points){
				model.points[i].previewRender.color = cornerDefaultColor;
			}
			
			for(let i in model.edges){
				model.edges[i].previewRender.color = edgeDefaultColor;
			}
			
			model.edges[e].previewRender.color = edgeHighlightColor;
			model.edges[e].a.previewRender.color = cornerHighlightColor;
			model.edges[e].b.previewRender.color = cornerHighlightColor;
			
			controls.update();
			
		});
		
		edgesContainer.appendChild(edgeInfoEl);
		
	}
	
	edgesContainer.style.display = "block";
	
	
	for(let e in model.edges){
		e = parseInt(e);
		
		let edgePreview = buildEdgePreview(model, e, params);
		
		model.edges[e].previewRender = renderer.addObject(edgePreview.triangles, edgePreview.normals, edgeDefaultColor);
		
		await pMon.updateCount(e+1);
	}
	
	controls = new Controls();
	
	//renderer.addEdges(model);
	
	controls.update();
	
	await pMon.postMessage("Done!", "success");
	await pMon.finish(0, 500);
}

async function loadShape(url){
	
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const result = await response.arrayBuffer();
		let shape = detectBinary(result);
		
		
		let triangles = [];
		
		for(let i = 0; i < shape.vertices.length; i += 9){
			
			triangles.push(
				CSG.Polygon.createFromPoints([
					[shape.vertices[i+0], shape.vertices[i+1], shape.vertices[i+2]],
					[shape.vertices[i+3], shape.vertices[i+4], shape.vertices[i+5]],
					[shape.vertices[i+6], shape.vertices[i+7], shape.vertices[i+8]],
				])
			);
			
		}
		
		let csgShape = CSG.fromPolygons(triangles);
		
		return csgShape;
		
	} catch (error) {
		console.error(error.message);
	}
	
}

async function buildAndShowCorner(cornerId){
	
	const cornerPMon = new ProgressMonitor(document.body, {
		itemsCount: 3,
		title: "Building geometry..."
	});
	
	await cornerPMon.start();
	
	for(let i in model.points){
		model.points[i].previewRender.visible = false;
		model.points[i].previewPinsRender.visible = false;
		if(model.points[i].geometryRender){
			model.points[i].geometryRender.visible = false;
		}
	}
	
	for(let i in model.edges){
		model.edges[i].previewRender.visible = false;
	}
	
	controls.update();
	
	let corner = await buildCorner(model, cornerId, params, letterShapes, cornerPMon);
	
	await cornerPMon.postMessage("Generating STL file...");
	
	generateStl(corner, cornerId);
	
	model.points[cornerId].builtGeometry = corner;
	model.points[cornerId].geometryRender = renderer.addObject(corner.triangles, corner.normals, [1.0, 0.7, 0.0]);
	
	await cornerPMon.postMessage("Done!", "success");
	await cornerPMon.finish(0, 500);
	
	controls.update();
	
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

function process3dData(data){
	
	let vertices = data.vertices;
	let normals = data.normals;
	
	var max = 0;
	var min = 0;
	var span = 0;
	
	var maxes = [0, 0, 0];
	var mins = [0, 0, 0];
	var spans = [0, 0, 0];
	
	for(var i = 0; i < vertices.length; i++){
		
		if(!vertices[i]){
			vertices[i] = 0;
		}
		
		var n = i % 3;
		
		maxes[n] = Math.max(maxes[n], vertices[i]);
		mins[n] = Math.min(mins[n], vertices[i]);
		spans[n] = Math.abs(maxes[n]) - Math.abs(mins[n]);
		
	}
	
	max = maxes.reduce(function(a, b) {
		return Math.max(a, b);
	});
	min = mins.reduce(function(a, b) {
		return Math.min(a, b);
	});
	span = spans.reduce(function(a, b) {
		return Math.max(a, b);
	});
	
	var span = max - min;
	
	//console.log("stl has "+vertices.length/3+" vertices");
	
	let points = [];
	let edges = [];
	let triangles = [];
	
	const tolerance = 0.0001;
	
	for(let tri = 0; tri < vertices.length; tri += 9){
		
		let trianglePoints = [];
		let triangleEdges = [];
		
		// deduplicate points
		for(let vert = 0; vert < 9; vert += 3){
			let point = {
				x: vertices[tri+vert],
				y: vertices[tri+vert+1],
				z: vertices[tri+vert+2],
				connections: [],
			}
			
			let existingPointId = -1;
			
			for(let p in points){
				if(Math.abs(point.x - points[p].x) < tolerance &&
				   Math.abs(point.y - points[p].y) < tolerance &&
				   Math.abs(point.z - points[p].z) < tolerance
				){
					existingPointId = parseInt(p);
					break;
				}
			}
			
			if(existingPointId === -1){
				existingPointId = points.length;
				points.push(point);
			}
			
			trianglePoints.push(points[existingPointId]);
		}
		
		// build deduplicated edges from references to points
		for(let e = 0; e < 3; e++){
			
			let edge = {
				a: trianglePoints[e],
				b: trianglePoints[(e+1)%3],
				triangles: [],
			};
			let existingEdgeId = -1;
			
			for(let ed in edges){
				
				if((edges[ed].a == edge.a && edges[ed].b == edge.b) ||
				   (edges[ed].a == edge.b && edges[ed].b == edge.a)
				){
					existingEdgeId = parseInt(ed);
					break;
				}
				
			}
			
			if(existingEdgeId === -1){
				existingEdgeId = edges.length;
				edges.push(edge);
			}
			
			triangleEdges.push(edges[existingEdgeId]);
			
		}
		
		let triangle = {
			points: trianglePoints,
			edges: triangleEdges,
		}
		
		for(let e in triangle.edges){
			triangle.edges[e].triangles.push(triangle);
		}
		
		triangle.normal = calculateNormalFromTriangle(triangle);
		
		triangles.push(triangle);
	}
	
	//console.log("stl has "+points.length+" points");
	//console.log("stl has "+edges.length+" edges");
	//console.log("stl has "+triangles.length+" triangles");
	
	let totalEdgeLength = 0;
	
	for(let e in edges){
		let distance = Math.sqrt(
			Math.pow(edges[e].a.x - edges[e].b.x, 2) +
			Math.pow(edges[e].a.y - edges[e].b.y, 2) +
			Math.pow(edges[e].a.z - edges[e].b.z, 2)
		);
		
		edges[e].edgeLength = distance;
		
		totalEdgeLength += distance;
		
		edges[e].connectionA = {
			point: edges[e].b,
			edge: edges[e],
		};
		edges[e].a.connections.push(edges[e].connectionA);
		
		edges[e].connectionB = {
			point: edges[e].a,
			edge: edges[e],
		};
		edges[e].b.connections.push(edges[e].connectionB);
		
		if(edges[e].triangles.length != 2){
			console.warn("Edge "+e+" has unusual amount of bordering triangles ("+edges[e].triangles.length+" instead of 2)");
		}
		
		edges[e].normal = {x: 0, y: 0, z: 0};
		for(let t in edges[e].triangles){
			edges[e].normal.x += edges[e].triangles[t].normal.x;
			edges[e].normal.y += edges[e].triangles[t].normal.y;
			edges[e].normal.z += edges[e].triangles[t].normal.z;
		}
		
		edges[e].normal = normaliseVec3(edges[e].normal);
		
	}
	
	//console.log(totalEdgeLength);
	
	console.log(points.toSorted(function(a, b) {
		return a.connections.length - b.connections.length;
	}));
	
	
	points.sort(function(a, b) {
		// sort points by position along x axis
		return a.x - b.x;
	});
	
	for(let p in points){
		points[p].id = p;
	}
	
	console.log(edges);
	//console.log(points);
	
	
	let model = {
		vertices: vertices,
		normals: normals,
		max: max,
		min: min,
		span: span,
		maxes: maxes,
		mins: mins,
		spans: spans,
		points: points,
		edges: edges,
		triangles: triangles,
	}
	
	return model;
}

function calculateNormalFromTriangle(triangle){
	let normal = {
		x: 0,
		y: 0,
		z: 0,
	};
	
	let a = {
		x: triangle.points[1].x - triangle.points[0].x,
		y: triangle.points[1].y - triangle.points[0].y,
		z: triangle.points[1].z - triangle.points[0].z,
	};
	
	let b = {
		x: triangle.points[2].x - triangle.points[0].x,
		y: triangle.points[2].y - triangle.points[0].y,
		z: triangle.points[2].z - triangle.points[0].z,
	};
	
	normal.x = a.y*b.z - a.z*b.y;
	normal.y = a.z*b.x - a.x*b.z;
	normal.z = a.x*b.y - a.y*b.x;
	
	return normaliseVec3(normal);
}

function normaliseVec3(vector){
	
	let newVector = {x: 0, y: 0, z: 0};
	
	let vecLength = Math.sqrt(
		Math.pow(vector.x, 2) +
		Math.pow(vector.y, 2) +
		Math.pow(vector.z, 2)
	);
	
	newVector.x = vector.x/vecLength;
	newVector.y = vector.y/vecLength;
	newVector.z = vector.z/vecLength;
	
	return newVector;
}