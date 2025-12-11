var fragmentShader = `
precision mediump float;

uniform lowp vec3 objectColor;

varying highp vec3 lighting;
varying float fogness;


void main(void){
	
	vec3 color = objectColor * lighting;
	gl_FragColor = vec4(color.rgb, 1.0);
}
`;