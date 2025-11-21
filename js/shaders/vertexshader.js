



var vertexShader = `

uniform mat4 model;
uniform mat4 view;
uniform mat4 perspective;
uniform mat4 normalTransform;
uniform float aspect;
uniform float maxDistance;

attribute vec3 coordinates;
attribute vec3 vertexNormal;
attribute vec3 vertexColor;

varying highp vec3 lighting;
varying vec3 varColor;
varying float fogness;

void main(void){

	highp vec3 ambientLight = vec3(0.3, 0.3, 0.5);
    highp vec3 directionalLightColor = vec3(1.0, 1.0, 0.9);
    highp vec3 directionalVector = normalize(vec3(-1.0, 1.0, 1.0));
    directionalVector = normalize((vec4(directionalVector, 1.0)*model).xyz);
    highp vec3 viewVector = normalize(vec3(0.0, 1.0, 0.0));
    viewVector = (vec4(viewVector, 1.0)*model).xyz;

	highp float directional = clamp(dot(normalize(vertexNormal.xzy), directionalVector), 0.0, 1.0);
	
	//float specular = min(dot(viewVector.xyz, reflect(directionalVector, normalize(vertexNormal.xzy))), 0.0);
	//specular = pow(specular, 4.0);
	
		
    //lighting = ambientLight + (directionalLightColor * directional * 1.0) + (directionalLightColor * specular * 0.8);
    
    lighting = ambientLight + (directionalLightColor * directional * 1.0);

	vec4 coords = vec4(coordinates.xzy, 1.0);

	coords = perspective * view * model * coords;
	
	//fogness = clamp(length(coords)/maxDistance, 0.0, 1.0);
	
	//lighting = ambientLight*(1.0-fogness);
	
	varColor = vertexColor;
	
	gl_Position = coords;
}

`;