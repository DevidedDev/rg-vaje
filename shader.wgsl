/*
CEVOVOD:
Najprej obdelaposamezna ogljišča (shader za ogljišča),
nato obdela plogskve/fragments/trikotnike (shader ploskev)


*/




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
    
    output.position = vec4(input.position, 1);
    output.color = input.color;
    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color;
    return output;
}



struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    //location poveže funkcije za elemente na indeksu 0
    @location(0) color: vec4f, // vrednost pred interpolacijo (interpolacija sčara skupaj barve, preden sopodane shaderju)

}

struct FragmentInput {
    //location poveže funkcije za elemente na indeksu 0
    @location(0) color: vec4f, // vrednost po interpolaciji
}

struct FragmentOutput {
    //lOkacija izhodne slike (moje platno- je samo eno, index 0 )
    //... !zato je tudi tabela "platen/slik" pri mojem cevovodu
    @location(0) color: vec4f,  
}

