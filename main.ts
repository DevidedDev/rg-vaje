
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
const positions = new Float32Array([
    -0.5, -0.5, 0,
     0.5, -0.5, 0,
     0.0,  0.5, 0,
]);
//medpomnilnik za ogljisca
const positionBuffer = device.createBuffer({
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(positionBuffer, 0, positions);
const positionBufferLayout : GPUVertexBufferLayout = {
    arrayStride: 12,
    attributes: [{
        shaderLocation: 0,
        offset: 0,
        format: 'float32x3',
    }]
};

//BARVE
const colors = new Float32Array([
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 1, 1,
]);
const colorBuffer = device.createBuffer({
    size: colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(colorBuffer, 0, colors);//0 = koliko bajtov od začetka medpomnilnikabomo začeli zapisovati?
const colorBufferLayout : GPUVertexBufferLayout = {
    arrayStride: 16, //za koliko bajtov preskakujemo v pomnilniku
    attributes: [{
        shaderLocation: 1, //lokacija 1 senčilnika ogljiščca
        offset: 0,
        format: 'float32x4', //4d vektor, z vrednostmi velikosti 32bajtov
    }]
};

//CEVOVOD(grafični)
const pipeline = device.createRenderPipeline({
    vertex: {
        module : shaderModule,
        buffers: [positionBufferLayout, colorBufferLayout],
    },
    fragment: {
        module : shaderModule,
        targets: [{ format }],
    },
    layout: 'auto',
});


const commandEncoder = device.createCommandEncoder(); // tukaj so ukazi
// Tu bomo zapisovali ukaze
    const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
        {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: [0.5, 0.5, 0.5, 1],
        storeOp: "store",
        },
    ],
    });
    // Tu bomo zapisovali ukaze za izris
        renderPass.setPipeline(pipeline); //nastavim da bom lahko risal
        renderPass.setVertexBuffer(0, positionBuffer);
        renderPass.setVertexBuffer(1, colorBuffer);
        renderPass.draw(3); //Koliko okljisc hocem izrisat? - mora biti deljivo s 3, ker sm v pipeline dolocil triktotnike
    renderPass.end();

const commandBuffer = commandEncoder.finish();//tukaj so ukazi vračunalnikuberljivem formatu - vrne ukazni medpomnilnik
device.queue.submit([commandBuffer]); //tukaj ukazičakajo na izvedbo. Device ime queue kamor se naložijo ti ukazi s pomočjo submit


