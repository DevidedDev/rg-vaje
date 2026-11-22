/*
CEVOVOD:
Najprej obdelaposamezna ogljišča (shader za ogljišča),
nato obdela plogskve/fragments/trikotnike (shader ploskev)


*/

//premik
@group(0) @binding(0) 
var<uniform> matrix : mat4x4f;


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
    
    output.position = matrix * vec4(input.position, 1);
    output.texcoords = input.texcoords;


    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = textureSample(baseTexture, baseSampler, input.texcoords);

    return output;
}



struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoords: vec2f,
}

struct FragmentInput {
    @location(0) texcoords: vec2f,
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