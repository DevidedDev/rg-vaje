
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

//sSHADER
const response = await fetch("./shader.wgsl");
const code = await response.text(); 
const shaderModule = device.createShaderModule({ code });

//CEVOVOD(grafični)
const pipeline = device.createRenderPipeline({
  vertex: {//pipeline ogljisc
    module: shaderModule, 
  },
  fragment: { //pipeline fragmentov
    module: shaderModule,
    targets: [{ format }], //seznam, ker bi lahko na več platen iztisali sliko
  },
  primitive: { //določimo,da bomo risali trikotnike, ki jih dolocajo ogljisca
    topology: "triangle-list",
  },
  layout: "auto", //razpored cevovoda se izlušči iz kode senčilnika
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
        renderPass.draw(3); //Koliko okljisc hocem izrisat? - mora biti deljivo s 3, ker sm v pipeline dolocil triktotnike
    renderPass.end();

const commandBuffer = commandEncoder.finish();//tukaj so ukazi vračunalnikuberljivem formatu - vrne ukazni medpomnilnik
device.queue.submit([commandBuffer]); //tukaj ukazičakajo na izvedbo. Device ime queue kamor se naložijo ti ukazi s pomočjo submit


