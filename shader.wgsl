/*
CEVOVOD:
Najprej obdelaposamezna ogljišča (shader za ogljišča),
nato obdela plogskve/fragments/trikotnike (shader ploskev)


*/

const colors = array(
    vec4f(1, 0, 0, 1),
    vec4f(0, 1, 0, 1),
    vec4f(0, 0, 1, 1),
);

const positions = array(
    vec3f(-0.5, -0.5, 0),
    vec3f( 0.5, -0.5, 0),
    vec3f( 0.0,  0.5, 0),
);

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.position = vec4f(positions[input.vertexIndex], 1);
    output.color = colors[input.vertexIndex];

    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    output.color = input.color;

    return output;
}


struct VertexInput {
    @builtin(vertex_index) vertexIndex: u32,
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
