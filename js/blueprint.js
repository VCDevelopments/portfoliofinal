// Shared holographic "blueprint" look used by the igloo and the rings.
import * as THREE from 'three';

// Holographic blueprint shell for the igloo blocks: translucent blue faces that brighten
// toward the silhouette (fresnel), faint scan lines, and a bright band sweeping upward.
export function blueprintMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScan: { value: -10 }, uReveal: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vN, vV, vW;
      void main() {
        vec4 p = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 w = modelMatrix * p;
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vN = normalize(mat3(modelViewMatrix) * n);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uScan, uReveal;
      varying vec3 vN, vV, vW;
      void main() {
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float lines = 0.75 + 0.25 * step(0.5, fract(vW.y * 14.0));
        float scan = exp(-pow((vW.y - uScan) * 3.0, 2.0));
        vec3 base = vec3(0.05, 0.22, 0.55);
        vec3 edge = vec3(0.35, 0.72, 1.15);
        vec3 col = mix(base, edge, fres) * lines + vec3(0.55, 0.85, 1.2) * scan * 0.8;
        float a = clamp((0.28 + 0.6 * fres + scan * 0.4) * uReveal, 0.0, 0.92);
        gl_FragColor = vec4(col, a);
      }`,
  });
}


// Bright cyan linework for blueprint wireframes and annotations.
export function blueprintLineMaterial(opacity = 0.6) {
  return new THREE.LineBasicMaterial({ color: new THREE.Color(0.7, 1.15, 1.9), transparent: true, opacity, fog: false, depthWrite: false, blending: THREE.AdditiveBlending });
}
