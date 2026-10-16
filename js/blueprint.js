// Shared holographic "blueprint" look used by the opening scan, the rings and the finale logo.
// All blueprint materials share one cyan tint.
import * as THREE from 'three';

const TINT = {
  uBase: { value: new THREE.Color(0.05, 0.22, 0.55) },
  uEdge: { value: new THREE.Color(0.35, 0.72, 1.15) },
  uLine: { value: new THREE.Color(0.7, 1.15, 1.9) },
};

// Translucent faces that brighten toward the silhouette (fresnel), faint scan lines,
// and a bright band sweeping upward.
export function blueprintMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScan: { value: -10 }, uReveal: { value: 0 }, uBase: TINT.uBase, uEdge: TINT.uEdge },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true, // honours clippingPlanes (the finale logo rebuilds behind one)
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
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
        vec4 mvPosition = mv;
        #include <clipping_planes_vertex>
        vN = normalize(mat3(modelViewMatrix) * n);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform float uTime, uScan, uReveal;
      uniform vec3 uBase, uEdge;
      varying vec3 vN, vV, vW;
      void main() {
        #include <clipping_planes_fragment>
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float lines = 0.75 + 0.25 * step(0.5, fract(vW.y * 14.0));
        float scan = exp(-pow((vW.y - uScan) * 3.0, 2.0));
        vec3 col = mix(uBase, uEdge, fres) * lines + (uEdge * 0.8 + 0.2) * scan * 0.8;
        float a = clamp((0.28 + 0.6 * fres + scan * 0.4) * uReveal, 0.0, 0.92);
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// Bright linework for blueprint wireframes and annotations.
export function blueprintLineMaterial(opacity = 0.6, extra = {}) {
  return new THREE.LineBasicMaterial({ color: TINT.uLine.value.clone(), transparent: true, opacity, fog: false, depthWrite: false, blending: THREE.AdditiveBlending, ...extra });
}

// The line colour as a shared uniform, for custom shaders that draw blueprint lines.
export const blueprintLineColor = TINT.uLine;
