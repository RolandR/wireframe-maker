var fragmentShader = `
precision mediump float;
//varying lowp vec4 vColor;

uniform lowp vec3 objectColor;

varying highp vec3 lighting;
varying float fogness;
varying vec3 varColor;


void main(void){
	//vec3 color = vec3(1.0, 0.7, 0.2);
	//vec3 color = varColor;
	vec3 color = objectColor * lighting;
	gl_FragColor = vec4(color, 1.0);
}
`;