/*
CEVOVOD:
Najprej obdelaposamezna ogljišča (shader za ogljišča),
nato obdela plogskve/fragments/trikotnike (shader ploskev)


*/

//premik
struct Uniforms {
    matrix: mat4x4f,
    normalMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}



@group(0) @binding(0)
var<uniform> uniforms: Uniforms;


const angle = radians(40);
const rotation = mat4x4f(
    vec4f(cos(angle), -sin(angle), 0,0),
    vec4f(sin(angle), cos(angle), 0,0),
    vec4f(0, 0, 1,0),
    vec4f(0, 0, 0, 1)
);

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.clipPosition = uniforms.matrix * vec4f(input.position, 1);
    output.position = (uniforms.modelMatrix * vec4f(input.position, 1)).xyz;
    output.texcoords = input.texcoords;
    output.normal = normalize(uniforms.normalMatrix * vec4f(input.normal, 0)).xyz;



    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    let materialColor = textureSample(baseTexture, baseSampler, input.texcoords);
    let lightColor = vec3f(1.0, 1.0, 1.0);

   let lightPosition = vec3f(-1.0, 1.0, 1.0);
let L = normalize(lightPosition - input.position);
let N = normalize(input.normal);

let distance = length(lightPosition - input.position);
let attenuation = 1.0 / (distance * distance);
let lightIntensity = lightColor * attenuation;
let lambertFactor = max(dot(L, N), 0.0) * lightIntensity;
output.color = vec4f(materialColor.rgb * lambertFactor, materialColor.a);

    output.color = vec4f(materialColor.rgb * lambertFactor * lightColor, materialColor.a);

    return output;
}

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}


struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}



struct FragmentOutput {
    //lOkacija izhodne slike (moje platno- je samo eno, index 0 )
    //... !zato je tudi tabela "platen/slik" pri mojem cevovodu
    @location(0) color: vec4f,  
}

@group(0) @binding(1)
var baseTexture: texture_2d<f32>;

@group(0) @binding(2)
var baseSampler: sampler;