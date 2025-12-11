var infoFragmentShader = `
precision mediump float;

uniform lowp vec3 objectColor;

uniform lowp ivec4 partID;

varying highp vec3 lighting;
varying float fogness;


void main(void){
	
	if(partID.a == 0){
		discard;
	}
	
	vec4 id = vec4(partID)/255.0;
	
	gl_FragColor = id;
}
`;