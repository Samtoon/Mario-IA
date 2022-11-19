document.getElementById("inputFileToRead").addEventListener("change", function () {
    console.log("hola")
    var fr = new FileReader();
    fr.readAsText(this.files[0]);
    fr.onload = function (e) {

        //Lee el laberinto en forma de txt y lo retorna en forma de matriz
        let l = e.target.result;
        let resultado = l.split(/\r?\n/).map((x) => x.split(" "));
        console.log(resultado);
        laberinto = resultado;
        tamanoLaberintoY = laberinto.length;
        tamanoLaberintoX = laberinto[0].length;
        
        graficarLaberinto();
        //recorrer(buscar(2));
        camino = buscar(5);
        document.querySelector(':root').style.setProperty("--dx", (camino[1].x - camino[0].x) * 66 + "px");
        console.log(getComputedStyle(document.querySelector(':root')).getPropertyValue("--dx"));
        document.querySelector(':root').style.setProperty("--dy", (camino[1].x - camino[0].x) * 66 + "px");
        console.log(getComputedStyle(document.querySelector(':root')).getPropertyValue("--dy"));
        //pasoMario();
        //buscar(1);


    };
});



//Laberinto en forma de matriz
let laberinto = [];
//Longitud del laberinto en y (número de filas)
let tamanoLaberintoY = 0;
let tamanoLaberintoX = 0;
let camino = [];
let indice = 0;
//El valor de cada agente en la matriz, según el enunciado del proyecto
const valoresMatriz = {
    casillaLibre: 0,
    muro: 1,
    mario: 2,
    estrella: 3,
    flor: 4,
    koopa: 5,
    princesa: 6
};
//Costos de cada casilla, para el algoritmo costos y posiblemente A*
const costosMatriz = {
    casillaLibre: 1,
    koopa: 6,
    conEstrella: 1 / 2
};

//Grafica el laberinto en consola de forma ordenada
function mirarLaberinto() {
    for (let j = 0; j < tamanoLaberintoY; j++) {
        for (let i = 0; i < tamanoLaberintoX; i++) {
            process.stdout.write(laberinto[j][i] + " ");
        }
        process.stdout.write("\n");
    }
}

/*Busca a la princesa. Recibe un entero que representa el algoritmo a utilizar (1: Amplitud, 2: Costos, 3: Profundidad)
y retorna un string indicando la posición de la princesa, el camino a seguir y el número de nodos generados. Más tarde sólo regresará
el camino para que Mario pueda seguirlo*/
function buscar(tipo = -1) {
    //Id del siguiente nodo a crear. El id representa la posición del nodo en el arreglo de nodos
    let idNuevoNodo = 0;
    //Se establece el punto de inicio de Mario
    const posicionMario = {};
    loop1:
    for (let j = 0; j < tamanoLaberintoY; j++) {
        for (let i = 0; i < tamanoLaberintoX; i++) {
            if (laberinto[j][i] == valoresMatriz.mario) {
                posicionMario.y = j;
                posicionMario.x = i;

                break loop1;
            }
        }
    }

    //Se establece la posicion de la princesa
    const posicionPrincesa = {};
    loop1:
    for (let j = 0; j < tamanoLaberintoY; j++) {
        for (let i = 0; i < tamanoLaberintoX; i++) {
            if (laberinto[j][i] == valoresMatriz.mario) {
                posicionPrincesa.y = j;
                posicionPrincesa.x = i;

                break loop1;
            }
        }
    }
    //Arreglo para almacenar todos los nodos
    const nodos = [];
    //Dependiendo del tipo, el primer nodo puede ser de clases distintas o con parámetros distintos
    switch (tipo) {
        case 2:          
            nodos[0] = new Nodo(obtenerId(), null, posicionMario.y, posicionMario.x);
            break;
        default:
            nodos[0] = new Nodo_Costo(obtenerId(), null, posicionMario.y, posicionMario.x, -1);
    }
    //La cola de nodos pendientes por expandir. Almacena los enteros que representan los id's de los nodos. Empieza con el primer nodo
    const nodosPendientes = [0];
    //El algoritmo corre hasta que la princesa haya sido encontrada
    let encontrado = false;
    //El arreglo que almacena los nodos que llevan a la princesa
    let camino = [];
    //Usado a la hora de crear el camino
    let nodoActual = {};

    let profundidadMax=0;
    //Expande el nodo con el id que se encuentre en la primera posición del arreglo de nodos pendientes
    expandir(nodos[nodosPendientes[0]]);
    while (!encontrado ) {
        /*Mientras la princesa no sea encontrada, se elimina el primer elemento de nodos pendientes (pues se acaba de expandir dicho nodo)
        y se repite el paso anterior*/
        nodosPendientes.shift();
        expandir(nodos[nodosPendientes[0]]);
    }
    //Se inicializa el nodo actual como el nodo donde se encuentra la princesa
    nodoActual = nodos[nodosPendientes[0]];
    profundidadMax=nodoActual.profundidad
    while (nodoActual.padre != null) {
        //Mientras el padre del nodo actual no sea null (mientras no sea la posición de Mario), se añade al arreglo camino y nodo actual pasa a ser el padre del nodo anterior
        camino.splice(0, 0, { y: nodoActual.y, x: nodoActual.x,p:nodoActual.profundidad });
        //laberinto[nodoActual.y][nodoActual.x] = "c";
        nodoActual = nodos[nodoActual.padre];  
    }
    //Se añade finalmente el nodo inicial de Mario
    camino.splice(0, 0, { y: nodoActual.y, x: nodoActual.x ,p:nodoActual.profundidad});

    console.log(profundidadMax)
    console.log("El camino tiene " + camino.length + " nodos");
    //console.log("La profundidad es",);
    /*return "La princesa está en la posición x: " + nodos[nodosPendientes[0]].x + " y: " + nodos[nodosPendientes[0]].y
        + " con un costo Acumulado de " + nodos[nodosPendientes[0]].costoAcumulado + ". En el árbol hay " + nodos.length + " nodos \nx:" + camino.map((x) => {return x.x}) + "\ny:" + camino.map((x) => x.y);*/
    return camino;

    //Se llama para retornar el Id del nuevo nodo creado y al mismo tiempo aumentar el contador para el siguiente nodo
    function obtenerId() {
        idNuevoNodo += 1;
        return idNuevoNodo - 1;
    }

    //Retorna la distancia de manhaytan de un nodo hasta la princesa,es usada como heuristica, ademas proporciona el numero por el que se quiere escalar la heuristica.
    function h_manhattan(nodo){

        return (Math.abs(nodo.x-posicionPrincesa.x)+Math.abs(nodo.y-posicionPrincesa.y))

    }



    

    //Recibe el nodo a expandir y añade sus hijos al arreglo nodos
    function expandir(nodo) {
        console.log(`Expandiendo nodo x: ${nodo.x} y: ${nodo.y}`);
        //False si el nodo ingresado tiene hijos
        let esteril = true;
        //Si en el nodo que se está expandiendo se encuentra la princesa, sale de la función y encontrado cambia a true
        if (laberinto[nodo.y][nodo.x] == valoresMatriz.princesa) {
            encontrado = true;
            return;
        }
        for (let i = 1; i <= 4; i++) { //Se repite una iteración por cada dirección posible
            let params; //Los parámetros específicos de cada dirección
            //condicion: condiciones generales bajo las cuales no se creará un hijo en dicha dirección
            //nuevoY: la nueva posición y del nodo a crear
            //nuevoX: la nueva posición x del nodo a crear
            switch (i) {
                case 1: //Arriba
                    params = { condicion: nodo.y == 0, nuevoY: nodo.y - 1, nuevoX: nodo.x };
                    break;
                case 2: //Abajo
                    params = { condicion: nodo.y == tamanoLaberintoY - 1, nuevoY: nodo.y + 1, nuevoX: nodo.x };
                    break;
                case 3: //Izquierda
                    params = { condicion: nodo.x == 0, nuevoY: nodo.y, nuevoX: nodo.x - 1 };
                    break;
                default: //Derecha
                    params = { condicion: nodo.x == tamanoLaberintoX - 1, nuevoY: nodo.y, nuevoX: nodo.x + 1 };
            }
            let j = nodo.id;
            let visitado;
            let k;
            //Evalúa que el nuevo nodo a crear aún no haya sido creado en la rama. Si al finalizar el while j no es null, el nuevo nodo se está repitiendo
            while (j != null) {
                if (params.nuevoY == nodos[j].y && params.nuevoX == nodos[j].x) {
                    break;
                }
                j = nodos[j].padre;
            }
            switch (tipo) {
                case 1: //Amplitud
                    if (j == null) {    //Sólo crea el hijo en caso de que no se esté repitiendo
                        const hijo = Nodo.crearHijo(params, nodo, idNuevoNodo);
                        if (hijo != null) {     //Sólo crea el hijo en caso de que no sea null
                            //Se adelanta el id del siguiente hijo a + 1, se añade el hijo creado y se añade su id al final de la cola de nodos pendientes                   
                            obtenerId();
                            nodos.push(hijo);
                            nodosPendientes.push(hijo.id);

                        }
                    }
                    break;
                case 2: //Costos
                    visitado = j != null;  //True si el hijo que se creará es de un nodo ya visitado. False en caso contrario
                    k = nodo.id;
                    while (k != null) {
                        //Evalúa si hay algún nuevo Ciclo (definición en la clase Nodo Costo) en la rama
                        if (nodos[k].nuevoCiclo) {
                            break;
                        }
                        k = nodos[k].padre;
                    }
                    if (j == null || j < k) {   //Sólo crea el hijo en caso de que no se esté repitiendo o que el nodo a repetir haya sido creado antes del nuevo ciclo
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, visitado);
                        if (hijo != null) {
                            obtenerId();
                            nodos.push(hijo);
                            let l = nodosPendientes.length;
                            //Se ubica el id del nodo en la cola de nodos pendientes de acuerdo a su costo
                            for (let i = 0; i < l; i++) {
                                if (nodos[nodosPendientes[i]].costoAcumulado > hijo.costoAcumulado) {
                                    nodosPendientes.splice(i, 0, hijo.id);
                                    break;
                                }
                            }
                            if (nodosPendientes.length == l) { nodosPendientes.push(hijo.id); }
                        }
                    }
                    break;
                case 3: //Profundidad evitando ciclos

                    if (j == null) {
                        const hijo = Nodo.crearHijo(params, nodo, idNuevoNodo);
                        if (hijo != null) {
                            //Lo mismo que amplitud, pero esteril cambia a false y el hijo se añade en la segunda posición de la cola, puesto que la primera es eliminada
                            esteril = false;
                            obtenerId();
                            nodos.push(hijo);
                            nodosPendientes.splice(1, 0, hijo.id);
                        }
                    }
                    if (i == 4 && esteril) {    //Si no se pudo crear ningún hijo, quiere decir que el nodo es estéril y que debe ser eliminado, pues ya no es de utilidad
                        let padre = nodo.id;
                        while (nodos[nodos.length - 1].id == padre) {
                            padre = nodos[nodos.length - 1].padre;
                            console.log("Eliminando x:" + nodos[nodos.length - 1].x + ", y:" + nodos[nodos.length - 1].y)
                            idNuevoNodo -= 1;
                            nodos.pop();
                        }
                    }
                    break;

                case 4: //Avara

                        visitado = j != null;  //True si el hijo que se creará es de un nodo ya visitado. False en caso contrario
                        k = nodo.id;
                        while (k != null) {
                            //Evalúa si hay algún nuevo Ciclo (definición en la clase Nodo Costo) en la rama
                            if (nodos[k].nuevoCiclo) {
                                break;
                            }
                            k = nodos[k].padre;
                        }
                        if (j == null || j < k) {   //Sólo crea el hijo en caso de que no se esté repitiendo o que el nodo a repetir haya sido creado antes del nuevo ciclo
                            const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, visitado);
                            if (hijo != null) {                         
                                obtenerId();
                                nodos.push(hijo);
                                let l = nodosPendientes.length;
                                console.log(h_manhattan( hijo))
                                //Se ubica el id del nodo en la cola de nodos pendientes de acuerdo a su costo
                                for (let i = 1; i < l; i++) {
                                    if (h_manhattan( nodos[nodosPendientes[i]]) > h_manhattan( hijo)) {
                                        nodosPendientes.splice(i, 0, hijo.id);
                                        break;
                                    }
                                }
                                if (nodosPendientes.length == l) { nodosPendientes.push(hijo.id); }
                                if(h_manhattan(hijo)==0){encontrado=true}                             
                            }
                            
                        }
                    break;
                case 5:
                    
                    visitado = j != null;  //True si el hijo que se creará es de un nodo ya visitado. False en caso contrario
                    k = nodo.id;
                    while (k != null) {
                        //Evalúa si hay algún nuevo Ciclo (definición en la clase Nodo Costo) en la rama
                        if (nodos[k].nuevoCiclo) {
                            break;
                        }
                        k = nodos[k].padre;
                    }
                    if (j == null || j < k) {   //Sólo crea el hijo en caso de que no se esté repitiendo o que el nodo a repetir haya sido creado antes del nuevo ciclo
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, visitado);
                        if (hijo != null) {
                            obtenerId();
                            nodos.push(hijo);
                            let l = nodosPendientes.length;
                            //Se ubica el id del nodo en la cola de nodos pendientes de acuerdo a su costo
                            for (let i = 1; i < l; i++) {
                                if (h_manhattan( nodos[nodosPendientes[i]]) + nodos[nodosPendientes[i]].costoAcumulado> h_manhattan( hijo)+hijo.costoAcumulado) {
                                    nodosPendientes.splice(i, 0, hijo.id);
                                    break;
                                }
                            }
                            if (nodosPendientes.length == l) { nodosPendientes.push(hijo.id); }   
                                                 
                        }
                    }
                    break;
                default:
            }
        }
    }
}

class Nodo {    //Clase padre para los nodos
    constructor(id, padre, y, x) {
        this.id = id;
        this.padre = padre;
        this.y = y;
        this.x = x;
    }
    static crearHijo(params, nodo, id) {
        //Crea el hijo sólo si las condiciones enviadas no se cumplen y si en esa posición no existen muros
        if (params.condicion) { }
        else if (laberinto[params.nuevoY][params.nuevoX] != valoresMatriz.muro) {
            return new Nodo(id, nodo.id, params.nuevoY, params.nuevoX);
        }
        return null;
    }
}

class Nodo_Costo extends Nodo {
    constructor(id, padre, y, x, costoAcumulado = 0,heuristica,profundidad=0, estado = { tipo: 0, duracion: 1 }, visitado = false) {
        super(id, padre, y, x);
        //Se define el estado como el estado del nodo padre
        this.estado = { tipo: estado.tipo, duracion: estado.duracion };
        let valorLaberinto = laberinto[y][x];
        this.nuevoCiclo = false;
        this.profundidad=profundidad;
        //Si la duración del estado es 0, se cambia al valor por defecto
        if (estado.duracion == 0) { this.estado = { tipo: 0, duracion: 1 } }
        switch (this.estado.tipo) {     //Evalúa el tipo del estado
            case 0: //Sin estado
                //El costo de la casilla cambia dependiendo si hay o no un koopa
                this.costo = valorLaberinto == valoresMatriz.koopa ? costosMatriz.koopa : costosMatriz.casillaLibre;
                if (valorLaberinto == valoresMatriz.estrella && !visitado) {
                    /*Si en la casilla hay una estrella y el nodo no ha sido visitado, quiere decir que la estrella no ha sido consumida
                    El estado cambia al tipo estrella con duración 6 y se establece un nuevo ciclo en el nodo*/
                    this.estado = { tipo: 1, duracion: 6 };
                    this.nuevoCiclo = true;
                }
                else if (valorLaberinto == valoresMatriz.flor && !visitado) {
                    //El mismo caso que la estrella, pero con una flor
                    this.estado = { tipo: 2, duracion: 1 };
                    this.nuevoCiclo = true;
                }
                break;
            case 1: //Con Estrella
                //El costo con la estrella siempre es el mismo
                this.costo = costosMatriz.conEstrella;
                //La duración aumenta si atrapa una nueva estrella, y disminuye en el caso contrario
                this.estado.duracion = valorLaberinto == valoresMatriz.estrella && !visitado ? this.estado.duracion + 5 : this.estado.duracion - 1;
                this.nuevoCiclo = valorLaberinto == valoresMatriz.estrella && !visitado ? true : false;

                break;
            default: //Con Flor
                this.costo = costosMatriz.casillaLibre;
                //La Flor sólo se gasta contra un Koopa
                if (valorLaberinto == valoresMatriz.flor && !visitado) {
                    this.estado.duracion += 1;
                    this.nuevoCiclo = true;
                }
                else if (valorLaberinto == valoresMatriz.koopa) { this.estado.duracion -= 1; }
        }
        //El costo acumulado del padre más el costo actual
        this.costoAcumulado = costoAcumulado + this.costo;
    }
    static crearHijo(params, nodo, id, visitado) {
        let hijo = super.crearHijo(params, nodo, id);
        return hijo == null ? hijo : new Nodo_Costo(hijo.id, hijo.padre, hijo.y, hijo.x, nodo.costoAcumulado,null, nodo.profundidad+1,nodo.estado, visitado);
    }
}




//console.log(busquedas.amplitud());
//console.log(mirarLaberinto())
/*
let start = performance.now();
console.log(buscar(1));
let end = performance.now();
console.log(`Amplitud tomó ${end - start} milisegundos`);
start = performance.now();
console.log(buscar(2));
end = performance.now();
console.log(`Costos tomó ${end - start} milisegundos`);
start = performance.now();
console.log(buscar(3));
end = performance.now();
console.log(`Profundidad Álvaro tomó ${end - start} milisegundos`);

function prueba() {
    ejemplo = new Nodo(0, null, { goku: 2 }, 3);
    ejemplo2 = new Nodo(3, 0, { goku: 3 }, 3);
    ejemplo2.y = ejemplo.y;
    console.log(ejemplo.y);
    console.log(ejemplo2.y);
    ejemplo2.y.goku = 7;
    console.log(ejemplo.y);
    console.log(ejemplo2.y);
}
*/

let vidas = 8;
const estado = {tipo: 0, duracion: 1};

function graficarLaberinto() {
    console.log("hola");
    let columnas = "";
    for (let j = 0; j < tamanoLaberintoY; j++) {
        for (let i = 0; i < tamanoLaberintoX; i++) {
            let valor = "";
            columnas = j == 0 ? columnas + "auto " : columnas;
            let id = j * tamanoLaberintoX + i + 1;
            let documento = document.getElementById("contenedor");
            let casilla = document.createElement("div");
            casilla.className = "casilla";
            casilla.setAttribute("id", "c" + id);
            switch (parseInt(laberinto[j][i])) {
                case valoresMatriz.muro:
                    valor = "muro";
                    break;
                case valoresMatriz.mario:
                    valor = "mario";
                    break;
                case valoresMatriz.estrella:
                    valor = "estrella";
                    break;
                case valoresMatriz.flor:
                    valor = "flor";
                    break;
                case valoresMatriz.koopa:
                    valor = "koopa";
                    break;
                case valoresMatriz.princesa:
                    valor = "princesa";
                    break;
                default:
                    console.log("ninguno");
            }
            if (valor != "") {
                let elemento = document.createElement("div");
                elemento.className = valor;
                if (valor == "mario") {
                    elemento.id = "mario";
                    elemento.addEventListener("animationend", pasoMario);
                }
                casilla.appendChild(elemento);
            }
            documento.appendChild(casilla);
        }
    }
    document.getElementById("contenedor").style.gridTemplateColumns = columnas;
    document.getElementById("vidas").innerHTML = vidas;
}



function recorrer(camino = []) {
    console.log("Recibí un camino")
    let detener = false;
    let i = 1;
    while (!detener) {
        let present = i;
        setTimeout(() => {
            let id = camino[present].y * tamanoLaberintoX + camino[present].x + 1;
            document.getElementById("c" + id).style.backgroundColor = "coral";
            efectoCasilla(camino[present]);
        }, i * 50);
        i += 1;
        console.log(i);
        detener = i == camino.length && vidas > 0 ? true : false;
    }
}


function pasoMario() {
    let id = camino[indice].y * tamanoLaberintoX + camino[indice].x + 1;
    document.getElementById("c" + id).appendChild(document.getElementById("mario"));
    console.log("indice:" + indice);
    console.log(document.getElementById("mario").parentElement);
    if(indice == camino.length - 1 || vidas == 0){
        document.getElementById("mario").style.animationPlayState = "paused";
    }
    else{
    let nodo = camino[indice];
    let raiz = document.querySelector(':root');
    const direccion = {dx: camino[indice + 1].x - nodo.x, dy: camino[indice + 1].y - nodo.y};
    if (direccion.dx == 1) {
        raiz.style.setProperty("--anguloY", "180deg");
    }
    else if (direccion.dx == -1) {
        raiz.style.setProperty("--anguloY", "0deg");
    }
    raiz.style.setProperty("--dx", (direccion.dx) * 66 + "px");
    raiz.style.setProperty("--dy", (direccion.dy) * 66 + "px");
    //onsole.log("El evento terminado es: " + event.animationName);
    efectoCasilla(nodo);
    indice += 1;
    }
}

function efectoCasilla(nodo) {
    const id = nodo.y * tamanoLaberintoX + nodo.x + 1;
    document.getElementById("c" + id).style.backgroundColor = "coral";
    const valorLaberinto = parseInt(laberinto[nodo.y][nodo.x]);
    console.log(valorLaberinto);
    if (estado.duracion == 0) {
        estado.tipo = 0;
        estado.duracion = 1;
    }
    estado.duracion = estado.tipo == 1 ? estado.duracion - 1 : estado.duracion;
    switch (valorLaberinto) {
        case 3:
            if (estado.tipo != 2) {
                estado.duracion = estado.tipo == 1 ? estado.duracion + 6 : 6;
                estado.tipo = 1;
            }
        case 4:
            if (estado.tipo != 1) {
                estado.duracion = estado.tipo == 2 ? estado.duracion + 1 : 1;
                estado.tipo = 2;
            }
            break;
        case 5:
            vidas = estado.tipo == 0 ? vidas - 1 : vidas;
            estado.duracion = estado.tipo == 2 ? estado.duracion - 1 : estado.duracion;
            break;
        case 6:
            console.log("encontrada");
            break;
        default:
    }
    let bonificacion;
    let src;
    switch (estado.tipo) {
        case 1:
            bonificacion = "Estrella";
            src = "sprites/Estrella.png";
            break;
        case 2:
            bonificacion = "Flor";
            src = "sprites/Flor.png";
            break;
        default:
            bonificacion = "";
            src = "";
    }
    console.log("Duración:" + estado.duracion);
    /*document.getElementById("c" + id).innerHTML = ""; */
    let vidasHTML = "";
    for(let i = 0; i < vidas; i++) {
        vidasHTML += "<img src=sprites/Corazon.png \>";
    }
    document.getElementById("vidas").innerHTML = vidasHTML;
    document.getElementById("bonificación").innerHTML = src == "" ? "" : `<img src=${src}\>`;
    document.getElementById("duración").innerHTML = estado.tipo != 0 ? estado.duracion : "";
}

