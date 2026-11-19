import { Mat4 } from "gl-matrix";
const adapter = await navigator.gpu.requestAdapter();
if (adapter === null) {
  throw new Error("Brskalnik ne podpira WebGPUja.");
}
const device = await adapter.requestDevice();



const canvas = document.querySelector("canvas");
if (canvas === null) {
  throw new Error("Platno ne obstaja.");
}

const context = canvas.getContext("webgpu");
if (context === null) {
  throw new Error("Kontekst webgpu ne obstaja.");
}

const format = navigator.gpu.getPreferredCanvasFormat(); //format barve za izris
context.configure({ device, format });

//SHADER
const response = await fetch("./shader.wgsl");
const code = await response.text(); 
const shaderModule = device.createShaderModule({ code });


//OGLJISCA

function krog(n : number){
  const radius = 0.5;
  const vertices : number[] = [];
  vertices.push(...[0, 0, 0, 1, 0, 0, 1]); //sredisce kroga
  for(let i = 1; i <= n; i++ ){
    const angle = (i / n) * 2 * Math.PI;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    vertices.push(...[x, y, 0, 1, 0, 0, 1]);
  }
  const indices : number[] = [];
  for(let i = 1; i<n; i++){
    indices.push(...[0, i, i+1]);
  }
  indices.push(...[0, n, 1]);

  return {vertices: new Float32Array(vertices),indices: new Uint32Array(indices)};
 


}
const w = 1/100;
function ctaX(){

}
function crtaY(){

}
function mreza(x:number, y:number){

  const vertices = [];
  const indices = [];
  let  c = 0;
  for(let i = 1; i<y;i++){
    let pos = (0-1)+(2/y)*(i);
    vertices.push(
    1, pos, 0,    1, 0, 0, 1,
    -1, pos, 0,    1, 0, 0, 1,
    1, pos+w, 0,    1, 0, 0, 1,
    -1, pos+w, 0,    1, 0, 0, 1,
    );
    indices.push(
      c, c+1, c+2,
      c+2, c+1, c+3,);
    c+=4;
  }

  for(let i = 1; i<x;i++){
    let pos = (0-1)+(2/x)*(i);
    vertices.push(
    pos, 1, 0,    1, 0, 0, 1,
    pos, -1, 0,    1, 0, 0, 1,
    pos+w, 1, 0,    1, 0, 0, 1,
    pos+w, -1, 0,    1, 0, 0, 1,
    );
    indices.push(
      c, c+1, c+2,
      c+2, c+1, c+3,);
    c+=4;
  }


  return {vertuces: new Float32Array(vertices), indes:new Uint32Array(indices)}
};

const m = mreza(10,10);
const vertices = m.vertuces;
const indices = m.indes;

/*
  const vertices = new Float32Array([
    // position    // color
    1, 0, 0,    1, 0, 0, 1,
    -1, 0, 0,    1, 0, 0, 1,
    1, w, 0,    1, 0, 0, 1,
    -1, w, 0,    1, 0, 0, 1,

]);
    const indices = new Uint32Array([
        // 1st triangle
        0, 1, 2,
        // 2nd triangle
        2, 1, 3,
    ]);
  */
//MEDPOMNILNIKI
const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);
const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 28, //12+16 = 28B
    attributes: [
        {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',//32bx3 oz... 4Bx3
        },
        {
            shaderLocation: 1,
            offset: 12, //zacnemo na 12B
            format: 'float32x4', //oz. 4Bx4
        },
    ]
};

const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(indexBuffer, 0, indices);

//unifrom buffer
const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});


//CEVOVOD(grafični)
const pipeline = device.createRenderPipeline({
  vertex: { //to je dejansko moj senčilnikiy shader.wgsl
    module: shaderModule,
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: shaderModule,
    targets: [{ format }],
  },
  layout: "auto",
});


const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
    ]
});

//naredim premik
device.queue.writeBuffer(uniformBuffer, 0, new Mat4());




function update() {
  const time = performance.now() / 1000;
  const radius = 0.5;
  const frequency = 0.5;
  const x = radius * Math.cos(frequency * time * 2 * Math.PI);
  const y = radius * Math.sin(frequency * time * 2 * Math.PI);

  const translation = Mat4.fromTranslation(new Mat4(), [ x, y, 0 ]);
  device.queue.writeBuffer(uniformBuffer, 0, translation as Float32Array);
}

function render() {
  const commandEncoder = device.createCommandEncoder(); // tukaj so ukazi
  // Tu bomo zapisovali ukaze
    const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
        {
        view: context!.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: [0.5, 0.5, 0.5, 1],
        storeOp: "store",
        },
    ],
    });
    // Tu bomo zapisovali ukaze za izris
        renderPass.setPipeline(pipeline); //nastavim da bom lahko risal
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setIndexBuffer(indexBuffer, 'uint32');
        renderPass.setBindGroup(0, bindGroup);
        renderPass.drawIndexed(indices.length);
    renderPass.end();

  const commandBuffer = commandEncoder.finish();//tukaj so ukazi vračunalnikuberljivem formatu - vrne ukazni medpomnilnik
  device.queue.submit([commandBuffer]); //tukaj ukazičakajo na izvedbo. Device ime queue kamor se naložijo ti ukazi s pomočjo submit

}

function frame() {
    update();
    render();
    requestAnimationFrame(frame);
}
render();
//requestAnimationFrame(frame);