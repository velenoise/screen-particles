precision highp float;

uniform sampler2D positions;
uniform sampler2D depthMap;
uniform vec2 planeSize;
uniform float timer;

varying vec2 vUv;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d) 
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d) 

void main() 
{
    vec2 cUv = vUv;
    cUv.y = 1.-cUv.y;

    float frequency = 0.01;
    float amplitude = 5.;

    vec3 pos = texture2D( positions, cUv ).rgb;
    vec3 tar = pos + (snoise3(vec3(pos.xy, timer) * 0.8) * .3);
    
    pos = mix(pos, tar, .5);

    vec2 dUv;
    dUv.x = (pos.x + planeSize.x * .5) / planeSize.x;
    dUv.y = (pos.y + planeSize.y * .5) / planeSize.y;

    pos.b = texture2D(depthMap, dUv).r;

    gl_FragColor = vec4( pos,1.0 );
}