var fragmentShader = `
precision mediump float;
//varying lowp vec4 vColor;

uniform lowp vec3 objectColor;

uniform lowp ivec4 partID;

varying highp vec3 lighting;
varying float fogness;
varying vec3 varColor;


void main(void){
	
	if(partID.a == 0){
		discard;
	}
	
	vec4 id = vec4(partID)/255.0;
	
	//vec3 color = objectColor * lighting;
	gl_FragColor = id;
}
`;