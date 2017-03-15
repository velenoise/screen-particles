precision highp float;

//float texture containing the positions of each particle
uniform sampler2D positions;

uniform float pointSize;
uniform float timer;

varying vec2 vUv;
varying vec4 vColor;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

void main() {
    vec3 DEFAULT_COLOR = vec3(0.35, 0.81, 0.92);

    vec2 cUv = vec2(uv.x, uv.y);
    vUv = vec2(cUv.x, cUv.y);

    vec3 pos = texture2D( positions, vUv ).xyz;

    if (abs(pos.z) >= 0.25)
    {
        pos.z = 1. - pos.z * .75;
    }

    float noiseFactor = snoise3(vec3(pos.xy, (timer)) * 0.3);

    vColor = vec4(DEFAULT_COLOR, noiseFactor * .5 + 0.45);

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
    
    gl_PointSize = pointSize * pos.z + 2.;
}