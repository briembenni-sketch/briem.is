/* briem.is — lifandi norðurljósa-bakgrunnur (WebGL, ekkert library)
   Flæðandi domain-warped noise í blá/cyan/grænum tónum. Bregst við mús og skrolli.
   Rennur niður í CSS-fallback (body::before) ef WebGL vantar. */
(function () {
  "use strict";

  var canvas = document.querySelector(".bg-canvas");
  if (!canvas) return;
  var gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var vert = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var frag = [
    "precision mediump float;",
    "uniform vec2 R;uniform float T;uniform vec2 M;uniform float S;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    " return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);",
    " for(int i=0;i<5;i++){v+=a*n(p);p=r*p*2.03;a*=.5;}return v;}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/R;",
    " vec2 p=(gl_FragCoord.xy-.5*R)/min(R.x,R.y);",
    " p.y-=S;",
    " float t=T*.045;",
    // domain warp — fljótandi silki
    " vec2 q=vec2(fbm(p*1.3+vec2(0.,t)),fbm(p*1.3+vec2(5.2,1.3)-t));",
    " vec2 w=vec2(fbm(p*1.1+2.8*q+vec2(1.7,9.2)+t*1.4),fbm(p*1.1+2.8*q+vec2(8.3,2.8)-t*1.1));",
    " float f=fbm(p*.9+2.4*w);",
    " vec3 bg=vec3(.027,.039,.078);",
    " vec3 blue=vec3(.184,.42,1.),cyan=vec3(.22,.74,.97),grn=vec3(.2,.83,.6);",
    " vec3 c=bg;",
    " c=mix(c,blue*.42,smoothstep(.38,.92,f));",
    " c=mix(c,cyan*.45,smoothstep(.55,1.05,length(q))*.55);",
    " c=mix(c,grn*.30,smoothstep(.55,.95,w.y)*.4);",
    // norðurljósa-borðar: bylgjaðar ljóstjöld með lóðréttum geislum
    " for(int i=0;i<2;i++){float k=float(i);",
    "  float y=.28-k*.62+.16*sin(p.x*1.6+t*6.+k*2.1)+.22*(fbm(vec2(p.x*.8+k*3.,t*2.))-.5);",
    "  float d=p.y-y;",
    "  float band=exp(-d*d*(26.-k*10.))*smoothstep(-.02,.25,d+.2);",
    "  float rays=.55+.45*fbm(vec2(p.x*9.+k*7.,t*3.+p.y*.6));",
    "  vec3 col=mix(cyan,grn,.5+.5*sin(p.x*1.3+t*4.+k*3.));",
    "  c+=col*band*rays*(.36-k*.1);}",
    // músarljós
    " float md=length(p-M);",
    " c+=mix(cyan,blue,.4)*.10*exp(-md*md*5.);",
    // vignette
    " c*=1.-.6*smoothstep(.25,1.25,length((uv-.5)*vec2(1.,1.2))*1.5);",
    " gl_FragColor=vec4(c,1.);",
    "}"
  ].join("\n");

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = sh(gl.VERTEX_SHADER, vert), fs = sh(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { canvas.remove(); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uR = gl.getUniformLocation(prog, "R"),
      uT = gl.getUniformLocation(prog, "T"),
      uM = gl.getUniformLocation(prog, "M"),
      uS = gl.getUniformLocation(prog, "S");

  /* norðurljós eru mjúk — hálf upplausn dugar og sparar GPU */
  var SCALE = 0.5;
  function resize() {
    var w = Math.max(1, Math.round(window.innerWidth * SCALE));
    var h = Math.max(1, Math.round(window.innerHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  var mx = 0.35, my = 0.25, tx = mx, ty = my;
  window.addEventListener("pointermove", function (e) {
    var m = Math.min(window.innerWidth, window.innerHeight);
    tx = (e.clientX - window.innerWidth / 2) / m;
    ty = (window.innerHeight / 2 - e.clientY) / m;
  }, { passive: true });

  var start = performance.now(), raf = 0, running = false;
  function frame(now) {
    resize();
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, reduced ? 12 : (now - start) / 1000);
    gl.uniform2f(uM, mx, my);
    gl.uniform1f(uS, window.scrollY / Math.max(1, window.innerHeight) * 0.18);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (running) raf = requestAnimationFrame(frame);
  }
  function play() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : play();
  });
  if (reduced) {
    frame(performance.now());
    window.addEventListener("resize", function () { frame(performance.now()); });
  } else {
    play();
  }
  canvas.classList.add("on");
})();
