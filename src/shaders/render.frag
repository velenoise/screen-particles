precision highp float;

uniform sampler2D positions;

varying vec2 vUv;
varying vec4 vColor;

void main()
{
    vec2 pos = vec2(vUv.x, vUv.y);
    vec3 color = texture2D(positions, pos).rgb;
    
    gl_FragColor = vColor;
}