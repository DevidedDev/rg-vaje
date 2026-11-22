import { Mat4 } from "gl-matrix";

// 1. ADAPTER, NAPRAVA, PLATNO
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




const format = navigator.gpu.getPreferredCanvasFormat(); // format barve za izris
context.configure({ device, format });

//Tekstura
const imageBitmap = await fetch('img.png')
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));

const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height],
    format: 'rgba8unorm',
    usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.COPY_DST,
});

device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height]);

//VZORČEVALNIK
const sampler = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
});

// 2. SHADER
const response = await fetch("./shader.wgsl");
const code = await response.text();
const shaderModule = device.createShaderModule({ code });

// 3. OPIS OGLIŠČ (skupen vsem objektom, zato zunaj razreda)
//samo pove kako naj vse stoji
const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 20,
  attributes: [
    {
      shaderLocation: 0,
      offset: 0,
      format: "float32x3",
    },
    {
      shaderLocation: 1,
      offset: 12,
      format: "float32x2",
    },
  ],
};

// 4. CEVOVOD (mora biti pred objekti, ker ga rabijo za bind group)
const pipeline = device.createRenderPipeline({
  vertex: {
    module: shaderModule,
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: shaderModule,
    targets: [{ format }],
  },
  layout: "auto",
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus',
}
});

//GLOBINSKA SLIKA
const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// 5. RAZRED OBJEKT
class objekt {
  vertices: Float32Array;
  indices: Uint32Array;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;

  constructor(vertices: Float32Array, indices: Uint32Array) {
    this.vertices = vertices;
    this.indices = indices;

    // medpomnilnik oglišč
    this.vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    // medpomnilnik indeksov
    this.indexBuffer = device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    // uniform buffer za matriko objekta
    this.uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: sampler }
      ],
      
    });

    // enotska matrika = brez premika
    device.queue.writeBuffer(this.uniformBuffer, 0, new Mat4() as Float32Array);
  }

  render(renderPass: GPURenderPassEncoder) {
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, "uint32");
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.drawIndexed(this.indices.length);
  }

  transform(matrix : Mat4){
    device.queue.writeBuffer(this.uniformBuffer, 0, matrix);
  }
}

// 6. OBJEKTI (šele zdaj, ko obstaja cevovod)


// Kvadrat, spodaj na sredini
const kocka= new objekt(
  new Float32Array([
  // positions     // texcoords
  -1, -1, -1,      0,  0,
  -1, -1,  1,      0,  1,
  -1,  1, -1,      1,  0,
  -1,  1,  1,      1,  1,
   1, -1, -1,      0,  0,
   1, -1,  1,      0,  1,
   1,  1, -1,      1,  0,
   1,  1,  1,      1,  1,
  ]),
  new Uint32Array([
    0, 1, 2,    2, 1, 3,
    4, 0, 6,    6, 0, 2,
    5, 4, 7,    7, 4, 6,
    1, 5, 3,    3, 5, 7,
    6, 2, 7,    7, 2, 3,
    1, 0, 5,    5, 0, 4,
  ]),
);


const objects = [kocka];
// MAtrike
const viewMatrix = Mat4.fromTranslation(new Mat4(), [0, 0, -5]);
//const viewMatrix = Mat4.lookAt(new Mat4(), [0, 0, 5], [0, 0, 0], [0, 1, 0]);//alternativa:
const projectionMatrix = Mat4.perspectiveZO(new Mat4(), 1, 1, 0.01, 1000);
const modelMatrix = new Mat4();



// 7. IZRIS
function render() {
  const matrix = new Mat4()
    .multiply(projectionMatrix)
    .multiply(viewMatrix)
    .multiply(modelMatrix);
  for (const obj of objects) {
    obj.transform(matrix);
  }
  


  const commandEncoder = device.createCommandEncoder();

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context!.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: [0.5, 0.5, 0.5, 1],
        storeOp: "store",
      },
      
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1,
      depthLoadOp: 'clear',
      depthStoreOp: 'discard',
  }
  

  });


  renderPass.setPipeline(pipeline);
  for (const obj of objects) {
    obj.render(renderPass);
  }
  renderPass.end();

  device.queue.submit([commandEncoder.finish()]);
}


function update(){
  render();
  const time = performance.now() / 1000;
  modelMatrix.identity().rotateX(time * 0.6).rotateY(time * 0.7);
  requestAnimationFrame(update); 

}

requestAnimationFrame(update);


