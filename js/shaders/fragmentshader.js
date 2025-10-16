var fragmentShader = `
precision mediump float;
//varying lowp vec4 vColor;
varying highp vec3 lighting;
varying float fogness;
void main(void){
	vec3 color = vec3(1.0, 0.7, 0.2);
	color = color * lighting;
	gl_FragColor = vec4(color, 1.0);
}
`;