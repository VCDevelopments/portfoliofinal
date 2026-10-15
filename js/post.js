// Final composite: blends two chapter renders with a glitchy horizontal smear,
// chromatic aberration, grain and vignette.
import * as THREE from 'three';

export function createComposite(renderer) {
  const opts = { type: THREE.HalfFloatType, samples: 4, depthBuffer: true };
  const rtA = new THREE.WebGLRenderTarget(1, 1, opts);
  const rtB = new THREE.WebGLRenderTarget(1, 1, opts);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: rtA.texture },
      tB: { value: rtB.texture },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uShift: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
    },
    depthTest: false,
    depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D tA, tB;
      uniform float uMix, uTime, uShift;
      uniform vec2 uRes;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }

      vec3 smear(sampler2D t, vec2 uv, float k, float ab) {
        // 5 taps along x: motion-blur-like streak plus RGB split
        vec3 c = vec3(0.0);
        for (int i = -2; i <= 2; i++) {
          vec2 o = vec2(float(i) * 0.012 * k, 0.0);
          c.r += texture2D(t, uv + o + vec2(ab, 0.0)).r;
          c.g += texture2D(t, uv + o).g;
          c.b += texture2D(t, uv + o - vec2(ab, 0.0)).b;
        }
        return c / 5.0;
      }

      void main() {
        vec2 uv = vUv;
        float k = sin(3.14159265 * clamp(uMix, 0.0, 1.0));   // transition peak at the midpoint
        float band = noise(vec2(uv.y * 60.0, uTime * 3.0));
        float slice = step(0.55, noise(vec2(uv.y * 9.0, floor(uTime * 12.0))));
        vec2 d = vec2((band - 0.5) * 0.12 * k + slice * 0.04 * k * (hash(vec2(floor(uv.y * 30.0), uTime)) - 0.5), 0.0);
        float ab = 0.0015 + uShift + 0.012 * k;

        vec3 a = smear(tA, uv + d, k, ab);
        vec3 b = smear(tB, uv - d, k, ab);
        float n = noise(uv * vec2(4.0, 26.0) + uTime);
        float w = smoothstep(0.35, 0.65, uMix + (n - 0.5) * 0.45);
        vec3 col = mix(a, b, w);

        col += k * 0.18;                                       // bloom-ish flash
        vec2 q = uv - 0.5;
        col *= 1.0 - dot(q, q) * 0.55;                          // vignette
        col += (hash(uv * uRes + fract(uTime) * 100.0) - 0.5) * 0.035; // grain

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });

  const quad = new THREE.Mesh(geo, mat);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    rtA,
    rtB,
    setSize(w, h) {
      rtA.setSize(w, h);
      rtB.setSize(w, h);
      mat.uniforms.uRes.value.set(w, h);
    },
    render(mix, time, shift) {
      mat.uniforms.uMix.value = mix;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uShift.value = shift;
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
    },
  };
}
