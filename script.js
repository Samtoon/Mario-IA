class Nodo_Costo {
    constructor(id, padre, y, x, costoAcumulado = 0,profundidad=0, estado = { tipo: 0, duracion: 1 }, valorLaberintoInicial) {
        this.valorLaberintoInicial = valorLaberintoInicial == null ? parseInt(laberinto[y][x]) : valorLaberintoInicial;
        this.id = id;
        this.padre = padre;
        this.y = y;
        this.x = x;
        this.estado = { tipo: estado.tipo, duracion: estado.duracion };
        this.nuevoCiclo = false;
        this.profundidad=profundidad;
        this.valorLaberintoFinal = this.valorLaberintoInicial;
        //El tipo 0 es el estado por defecto
        if (estado.duracion == 0) { this.estado = { tipo: 0, duracion: 1 }; this.nuevoCiclo = true;}
        switch (this.estado.tipo) {
            case 0: //Sin estado
                switch(this.valorLaberintoInicial) {
                    case valoresMatriz.estrella:
                        this.estado = { tipo: 1, duracion: 6 };
                        this.nuevoCiclo = true;
                        this.valorLaberintoFinal = valoresMatriz.casillaLibre;
                        break;
                    case valoresMatriz.flor:
                        this.estado = { tipo: 2, duracion: 1 };
                        this.nuevoCiclo = true;
                        this.valorLaberintoFinal = valoresMatriz.casillaLibre;
                        break;
                    default:
                }
                this.costo = this.valorLaberintoInicial == valoresMatriz.koopa ? costosMatriz.koopa : costosMatriz.casillaLibre;
                break;
            case 1: //Con Estrella
                switch(this.valorLaberintoInicial) {
                    case valoresMatriz.estrella:
                        this.estado.duracion += 6;
                    case valoresMatriz.koopa:
                        this.nuevoCiclo = true;
                        this.valorLaberintoFinal = valoresMatriz.casillaLibre;
                    default:
                        this.estado.duracion -= 1;
                        this.costo = costosMatriz.conEstrella;
                }
                break;
            default: //Con Flor
                switch(this.valorLaberintoInicial) {
                    case valoresMatriz.flor:
                        this.estado.duracion += 1;
                        this.nuevoCiclo = true;
                        this.valorLaberintoFinal = valoresMatriz.casillaLibre;
                        break;
                    case valoresMatriz.koopa:
                        this.estado.duracion -= 1;
                        this.nuevoCiclo = true;
                        this.valorLaberintoFinal = valoresMatriz.casillaLibre;
                        break;
                    default:
                }
                this.costo = costosMatriz.casillaLibre;
        }
        this.costoAcumulado = costoAcumulado + this.costo;
    }
    static crearHijo(params, nodo, id, valorLaberintoInicial) {
        if (params.condicion) {}
        else if (laberinto[params.nuevoY][params.nuevoX] != valoresMatriz.muro) {
            return new Nodo_Costo(id, nodo.id, params.nuevoY, params.nuevoX, nodo.costoAcumulado, nodo.profundidad+1,nodo.estado, valorLaberintoInicial);
        }
        return null;
    }
    toString() {
        return `id: ${this.id}; x: ${this.x}; y: ${this.y}; valor: ${this.valorLaberintoInicial}; g: ${this.costoAcumulado}`
    }
}

//=============================Variables y constantes globales================================


let laberinto = [];
let tamanoLaberintoY = 0;
let tamanoLaberintoX = 0;
let camino = [];
let indice = 1;
let vidas = 3;
const estado = { tipo: 0, duracion: 1 };
let mario;
const reporte = {};
const nodos = [];
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
//Costos de cada casilla, para el algoritmo costos y A*
const costosMatriz = {
    casillaLibre: 1,
    koopa: 6,
    conEstrella: 1 / 2
};
document.getElementById("inputFileToRead").addEventListener("change", function () {
    var fr = new FileReader();
    fr.readAsText(this.files[0]);
    fr.onload = function (e) {

        //Lee el laberinto en forma de txt y lo retorna en forma de matriz
        let l = e.target.result;
        let resultado = l.split(/\r?\n/).map((x) => x.split(" "));
        laberinto = resultado;
        tamanoLaberintoY = laberinto.length;
        tamanoLaberintoX = laberinto[0].length;
        graficarLaberinto();
        const start = Date.now();
        camino = buscar(parseInt(document.getElementById("Algoritmo").value));
        const end = Date.now();
        reporte.tiempo = new Date(end - start).toISOString().slice(11, 19);
        reporte.admisibilidad = newton_raphson(reporte.profundidad, reporte.nodos);
        document.querySelector(':root').style.setProperty("--dx", (camino[1].x - camino[0].x) * 66 + "px");
        document.querySelector(':root').style.setProperty("--dy", (camino[1].y - camino[0].y) * 66 + "px");
        document.getElementById("nodosCreados").appendChild(document.createTextNode(reporte.nodos));
        document.getElementById("tiempo").appendChild(document.createTextNode(reporte.tiempo));
        document.getElementById("profundidad").appendChild(document.createTextNode(reporte.profundidad));
        document.getElementById("admisibilidad").appendChild(document.createTextNode(reporte.admisibilidad));
        document.getElementById("costo").appendChild(document.createTextNode(reporte.costo));
        graficarNodos(0,1);
    };
});

//============================================================================================

//====================================Función principal=======================================

/*Busca a la princesa. Recibe un entero que representa el algoritmo a utilizar (1: Amplitud, 2: Costos, 3: Profundidad, 4: Avara y 5: A*)
y retorna el camino de nodos a seguir*/
function buscar(tipo = -1) {
    //El id representa la posición del nodo en el arreglo de nodos
    let idNuevoNodo = 0;
    //Almacena los enteros que representan los id's de los nodos. Empieza con el primer nodo
    const nodosPendientes = [0];
    let encontrado = false;
    let camino = [];
    let nodoActual = {};
    let profundidadMax=0;
    const posicionMario = {};
    const posicionPrincesa = {};
    loop1:
    for (let j = 0; j < tamanoLaberintoY; j++) {
        for (let i = 0; i < tamanoLaberintoX; i++) {
            if (laberinto[j][i] == valoresMatriz.mario) {
                posicionMario.y = j;
                posicionMario.x = i;
            }
            else if (laberinto[j][i] == valoresMatriz.princesa) {
                posicionPrincesa.y = j;
                posicionPrincesa.x = i;
            }
            if (Object.keys(posicionMario) != 0 && Object.keys(posicionPrincesa) != 0) {
                break loop1;
            }
        }
    }
    nodos[0] = new Nodo_Costo(obtenerId(), null, posicionMario.y, posicionMario.x, -1);
    expandir(nodos[nodosPendientes[0]]);
    while (!encontrado ) {
        nodosPendientes.shift();
        expandir(nodos[nodosPendientes[0]]);
    }
    nodoActual = nodos[nodosPendientes[0]];
    profundidadMax=nodoActual.profundidad;
    while (nodoActual.padre != null) {
        camino.splice(0, 0, nodoActual);
        nodoActual = nodos[nodoActual.padre];  
    }
    //Se añade finalmente el nodo inicial de Mario
    camino.splice(0, 0, { y: nodoActual.y, x: nodoActual.x });
    reporte.nodos = nodos.length;
    reporte.profundidad = profundidadMax;
    reporte.costo = nodos[nodosPendientes[0]].costoAcumulado;
    return camino;

    
    //====================================Funciones auxiliares====================================

    //Se llama para retornar el Id del nuevo nodo creado y al mismo tiempo aumentar el contador para el siguiente nodo
    function obtenerId() {
        idNuevoNodo += 1;
        return idNuevoNodo - 1;
    }

    //Retorna la distancia de manhattan de un nodo hasta la princesa. Es usada como heuristica, además proporciona el número por el que se quiere escalar la heuristica.
    function h_manhattan(nodo){
        return ((Math.abs(nodo.x-posicionPrincesa.x)+Math.abs(nodo.y-posicionPrincesa.y)))*costosMatriz.conEstrella;
    }

    //Recibe el nodo a expandir y añade sus hijos al arreglo nodos
    function expandir(nodo) {
        let esteril = true;
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
            let k = j;
            //Evalúa que el nuevo nodo a crear aún no haya sido creado en la rama. Si al finalizar el while j no es null, el nuevo nodo se está repitiendo
            while (j != null) {
                if (params.nuevoY === nodos[j].y && params.nuevoX === nodos[j].x) {
                    break;
                }
                j = nodos[j].padre;
            }
            let valorLaberintoInicial = j != null ? nodos[j].valorLaberintoFinal : null;
            switch (tipo) {
                case 1: //Amplitud
                    if (j == null) { 
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, valorLaberintoInicial);
                        if (hijo != null) {                 
                            obtenerId();
                            nodos.push(hijo);
                            nodosPendientes.push(hijo.id);

                        }
                    }
                    break;
                case 2: //Costos
                    while (k != null) {
                        //Evalúa si hay algún nuevo ciclo en la rama
                        if (nodos[k].nuevoCiclo) {
                            break;
                        }
                        k = nodos[k].padre;
                    }
                    if (j == null || j < k) {   //Sólo crea el hijo en caso de que no se esté repitiendo o que el nodo a repetir haya sido creado antes del nuevo ciclo
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, valorLaberintoInicial);
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
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, valorLaberintoInicial);
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
                            idNuevoNodo -= 1;
                            nodos.pop();
                        }
                    }
                    break;
                case 4: //Avara
                        if (j == null) {   //Sólo crea el hijo en caso de que no se esté repitiendo o que el nodo a repetir haya sido creado antes del nuevo ciclo
                            const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, valorLaberintoInicial);
                            if (hijo != null) {                         
                                obtenerId();
                                nodos.push(hijo);
                                let l = nodosPendientes.length;
                                //Se ubica el id del nodo en la cola de nodos pendientes de acuerdo a su heurística
                                for (let i = 1; i < l; i++) {
                                    if (h_manhattan( nodos[nodosPendientes[i]]) > h_manhattan( hijo)) {
                                        nodosPendientes.splice(i, 0, hijo.id);
                                        break;
                                    }
                                }
                                if (nodosPendientes.length == l) { nodosPendientes.push(hijo.id); }                           
                            }
                            
                        }
                    break;
                case 5: //A* 
                    while (k != null) {
                        //Evalúa si hay algún nuevo ciclo en la rama
                        if (nodos[k].nuevoCiclo) {
                            break;
                        }
                        k = nodos[k].padre;
                    }
                    if (j == null || j < k) {   //Sólo crea el hijo en caso de que no se esté repitiendo o que el nodo a repetir haya sido creado antes del nuevo ciclo
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, valorLaberintoInicial);
                        if (hijo != null) {
                            obtenerId();
                            nodos.push(hijo);
                            let l = nodosPendientes.length;
                            //Se ubica el id del nodo en la cola de nodos pendientes de acuerdo a su heurística y costo
                            for (let i = 1; i < l; i++) {
                                if (h_manhattan( nodos[nodosPendientes[i]]) + nodos[nodosPendientes[i]].costoAcumulado > h_manhattan(hijo)+hijo.costoAcumulado) {
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

    //============================================================================================
}

//============================================================================================

//================================Funciones auxiliares globales===============================

//Añade las casillas a la página
function graficarLaberinto() {
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
            let elemento = document.createElement("div");
            switch (parseInt(laberinto[j][i])) {
                case valoresMatriz.muro:
                    valor = "muro";
                    break;
                case valoresMatriz.mario:
                    valor = "mario";
                    elemento.id = "mario";
                    elemento.addEventListener("animationiteration", pasoMario);
                    elemento.classList.add("camina");
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
            }
            if (valor != "") {
                elemento.classList.add(valor);
                casilla.appendChild(elemento);
            }
            documento.appendChild(casilla);
        }
    }
    mario = document.getElementById("mario");
    document.getElementById("contenedor").style.gridTemplateColumns = columnas;
}

//Anima el movimiento de Mario al final de cada iteración de animación
function pasoMario(event) {
    if (event.animationName == "moverMario") {
        let id = camino[indice].y * tamanoLaberintoX + camino[indice].x + 1;
        const nodo = camino[indice];
        const raiz = document.querySelector(':root');
        raiz.style.setProperty("--anguloYviejo", getComputedStyle(raiz).getPropertyValue("--anguloY"));
        const valxant = parseInt(getComputedStyle(raiz).getPropertyValue("--dx"));
            const valyant = parseInt(getComputedStyle(raiz).getPropertyValue("--dy"));
            raiz.style.setProperty("--dxviejo", valxant + "px");
            raiz.style.setProperty("--dyviejo", valyant + "px");
        if (vidas == 0) {
            document.getElementById("c" + id).innerHTML = "";
            document.getElementById("c" + id).appendChild(mario);
            mario.classList.remove("camina");
            mario.classList.remove("sube");
            mario.classList.add("muerte");
            mario.style.height = "100%";
        }
        else if (indice == camino.length - 1) {
            id = camino[indice - 1].y * tamanoLaberintoX + camino[indice - 1].x + 1;
            document.getElementById("c" + id).appendChild(mario);
            mario.style.animationPlayState = "paused";
            mario.style.animation = "marioPulgar 1000ms step-end forwards";
            document.getElementsByClassName("princesa")[0].style.animation = "peachSorpresa 250ms step-end forwards";
            efectoCasilla(nodo);
            indice += 1;
        }
        else {
            const direccion = { dx: camino[indice + 1].x - nodo.x, dy: camino[indice + 1].y - nodo.y };
            if (direccion.dx == 1) {
                raiz.style.setProperty("--anguloY", "180deg");
            }
            else if (direccion.dx == -1) {
                raiz.style.setProperty("--anguloY", "0deg");
            }
            if (direccion.dy == -1) {
                mario.classList.replace("camina", "sube");
            }
            else {
                if (mario.classList.contains("sube")) {
                    mario.classList.replace("sube", "camina");
                }
            }
            raiz.style.setProperty("--dx", ((direccion.dx) * 66 + valxant) + "px");
            raiz.style.setProperty("--dy", ((direccion.dy) * 66 + valyant) + "px");
            efectoCasilla(nodo);
            indice += 1;
        }
    } else if (event.animationName == "marioDaño") {
        mario.classList.remove("daño");
    }
}

// Cambia los componentes gráficos de la casilla dependiendo del estado del agente (Mario)
function efectoCasilla(nodo) {
    const id = nodo.y * tamanoLaberintoX + nodo.x + 1;
    if (estado.duracion == 0) {
        estado.tipo = 0;
        estado.duracion = 1;
    }
    estado.duracion = estado.tipo == 1 ? estado.duracion - 1 : estado.duracion;
    switch (parseInt(nodo.valorLaberintoInicial)) {
        case valoresMatriz.estrella:
            if (estado.tipo != 2) {
                estado.duracion = estado.tipo == 1 ? estado.duracion + 6 : 6;
                estado.tipo = 1;
                document.getElementById("c" + id).innerHTML = "";
            }
        case valoresMatriz.flor:
            if (estado.tipo != 1) {
                estado.duracion = estado.tipo == 2 ? estado.duracion + 1 : 1;
                estado.tipo = 2;
                document.getElementById("c" + id).innerHTML = "";
            }
            break;
        case valoresMatriz.koopa:
            vidas = estado.tipo == 0 ? vidas - 1 : vidas;
            estado.duracion = estado.tipo == 2 ? estado.duracion - 1 : estado.duracion;
            if (estado.tipo == 1) {
                document.getElementById("c" + id).firstChild.classList.add("pataleta");
            } else if (estado.tipo == 2) {
                document.getElementById("c" + id).firstChild.classList.add("pataletaQuemado");
            } else {
                mario.classList.add("daño");
            }
            break;
        default:
    }
    let src;
    switch (estado.tipo) {
        case 1:
            src = "sprites/Estrella.png";
            break;
        case 2:
            src = "sprites/Flor.png";
            break;
        default:
            src = "";
    }
    let vidasHTML = "";
    for (let i = 0; i < vidas; i++) {
        vidasHTML += "<img src=sprites/Corazon.png \>";
    }
    document.getElementById("vidas").innerHTML = vidasHTML;
    document.getElementById("bonificación").innerHTML = src == "" ? "" : `<img src=${src}\>`;
    document.getElementById("duración").innerHTML = estado.tipo != 0 ? estado.duracion : "";
}

//Cambia los algoritmos disponibles dependiendo del tipo de búsqueda
function mostrarAlgoritmos() {
    const selector = document.getElementById("Algoritmo");
    const opcion1 = document.createElement("option");
    const opcion2 = document.createElement("option");
    const opcion3 = document.createElement("option");
    selector.innerHTML = "";
    if (document.getElementById("tipoBusqueda").value == "NoInformada") {
        opcion1.value = "1";
        opcion1.innerHTML = "preferente por Amplitud";
        selector.appendChild(opcion1);
        opcion2.value = "2";
        opcion2.innerHTML = "de costo uniforme";
        selector.appendChild(opcion2);
        opcion3.value = "3";
        opcion3.innerHTML = "preferente por profundidad evitando ciclos";
        selector.appendChild(opcion3);
    }
    else {
        opcion1.value = "4";
        opcion1.innerHTML = "Avara";
        selector.appendChild(opcion1);
        opcion2.value = "5";
        opcion2.innerHTML = "A*";
        selector.appendChild(opcion2);
    }
}

function polinomio(n,x,nodos){
    let valor=0;
    for(let i=0 ; i<=n ; i++){
        valor=valor+Math.pow(x,i);
    }
    return valor-nodos;
}

function derivada(n,x){
    let valor=0;
    for(let i=0 ; i<=n ; i++){
        if(i>0){
            valor=valor+i*Math.pow(x,i-1);
        }
    }
    return valor;
}

function newton_raphson(n,nodos){
    let x = 0;
    for(let i=0 ; i<=1000 ; i++){
        x = x - (polinomio(n,x,nodos) / derivada(n,x));
    }
    return x;
}

//Crea el árbol de nodos
function graficarNodos(id,direccion) {
    const casilla = nodos[id].y * tamanoLaberintoX + nodos[id].x + 1;
    let hijos = []
    const maxHijos = 4;
    let i = id + 1;
    let c = 0;
    if (direccion == 1) {
        while (c < maxHijos && i < nodos.length) {
            if (nodos[i].padre == id) {
                hijos.push(nodos[i]);
                c += 1;
            }
            i += 1;
        }
        document.getElementById("c" + casilla).classList.add("camino");
        document.getElementById("nodoPadre").innerHTML = nodos[id].toString();
        document.getElementById("nodoPadre").value = id;
        document.getElementById("nodosHijos").innerHTML = "";
        hijos.forEach((x) => {
            let hijo = document.createElement("div");
            hijo.onclick = () => {graficarNodos(x.id,1)};
            hijo.id = "h" + x.id;
            hijo.innerHTML = x.toString();
            hijo.style = "padding: 10px;"
            for (let i in camino) {
                if (camino[i].id == x.id) {
                    hijo.classList.add("camino");
                    break;
                }
            }
            document.getElementById("nodosHijos").appendChild(hijo);
        });
    }
    else {
        document.getElementById("c" + casilla).classList.remove("camino");
        graficarNodos(nodos[id].padre,1)
    }
}

//Grafica el laberinto en consola de forma ordenada
function mirarLaberinto() {
    for (let j = 0; j < tamanoLaberintoY; j++) {
        for (let i = 0; i < tamanoLaberintoX; i++) {
            process.stdout.write(laberinto[j][i] + " ");
        }
        process.stdout.write("\n");
    }
}

//============================================================================================

