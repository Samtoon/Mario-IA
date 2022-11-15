const { readFileSync } = require('fs');
const { default: nodeTest } = require('node:test');
const { performance } = require('perf_hooks');

function leerLaberinto() {
    const laberinto = readFileSync("laberinto.txt", "utf-8").split(/\r?\n/).map((x) => x.split(" "));
    return laberinto;
}

const laberinto = leerLaberinto();
const tamanoLaberinto = laberinto.length;
const valoresMatriz = {
    casillaLibre: 0,
    muro: 1,
    mario: 2,
    estrella: 3,
    flor: 4,
    koopa: 5,
    princesa: 6
};
const costosMatriz = {
    casillaLibre: 1,
    koopa: 6,
    conEstrella: 1 / 2
};

function mirarLaberinto() {
    for (let j = 0; j < tamanoLaberinto; j++) {
        for (let i = 0; i < tamanoLaberinto; i++) {
            process.stdout.write(laberinto[j][i] + " ");
        }
        process.stdout.write("\n");
    }
}

function buscar(tipo = -1) {
    let idNuevoNodo = 0;
    const posicionMario = {};
    loop1:
    for (let j = 0; j < tamanoLaberinto; j++) {
        for (let i = 0; i < tamanoLaberinto; i++) {
            if (laberinto[j][i] == valoresMatriz.mario) {
                posicionMario.y = j;
                posicionMario.x = i;
                break loop1;
            }
        }
    }
    const nodos = [];
    switch (tipo) {
        case 2:
            nodos[0] = new Nodo_Costo(obtenerId(), null, posicionMario.y, posicionMario.x, -1);
            break;
        default:
            nodos[0] = new Nodo(obtenerId(), null, posicionMario.y, posicionMario.x);
    }
    const nodosPendientes = [0];
    let encontrado = false;
    let camino = [];
    let nodoActual = {};
    expandir(nodos[nodosPendientes[0]]);
    while (!encontrado) {
        nodosPendientes.shift();
        expandir(nodos[nodosPendientes[0]]);
    }
    nodoActual = nodos[nodosPendientes[0]];
    while (nodoActual.padre != null) {
        camino.splice(0, 0, { y: nodoActual.y, x: nodoActual.x });
        //laberinto[nodoActual.y][nodoActual.x] = "c";
        nodoActual = nodos[nodoActual.padre];
    }
    camino.splice(0, 0, { y: nodoActual.y, x: nodoActual.x });
    return "La princesa está en la posición x: " + nodos[nodosPendientes[0]].x + " y: " + nodos[nodosPendientes[0]].y
        + " con un costo Acumulado de " + nodos[nodosPendientes[0]].costoAcumulado + ". En el árbol hay " + nodos.length + " nodos \nx:" + camino.map((x) => x.x) + "\ny:" + camino.map((x) => x.y);
    function obtenerId() {
        idNuevoNodo += 1;
        return idNuevoNodo - 1;
    }
    function expandir(nodo) {

        let esteril = true;
        if (laberinto[nodo.y][nodo.x] == valoresMatriz.princesa) {
            encontrado = true;
            return;
        }
        for (let i = 1; i <= 4; i++) {
            let params;
            switch (i) {
                case 1:
                    params = { condicion: nodo.y == 0, nuevoY: nodo.y - 1, nuevoX: nodo.x };
                    break;
                case 2:
                    params = { condicion: nodo.y == tamanoLaberinto - 1, nuevoY: nodo.y + 1, nuevoX: nodo.x };
                    break;
                case 3:
                    params = { condicion: nodo.x == 0, nuevoY: nodo.y, nuevoX: nodo.x - 1 };
                    break;
                default:
                    params = { condicion: nodo.x == tamanoLaberinto - 1, nuevoY: nodo.y, nuevoX: nodo.x + 1 };
            }
            j = nodo.id;
            while (j != null) {
                if (params.nuevoY == nodos[j].y && params.nuevoX == nodos[j].x) {
                    break;
                }
                j = nodos[j].padre;
            }
            switch (tipo) {
                case 1: //Amplitud
                    if (j == null) {
                        const hijo = Nodo.crearHijo(params, nodo, idNuevoNodo);
                        if (hijo != null) {
                            obtenerId();
                            nodos.push(hijo);
                            nodosPendientes.push(hijo.id);
                        }
                    }
                    break;
                case 2: //Costos
                    visitado = j != null;
                    k = nodo.id;
                    while (k != null) {
                        if (nodos[k].nuevoCiclo) {
                            break;
                        }
                        k = nodos[k].padre;
                    }
                    if (j == null || j < k) {
                        const hijo = Nodo_Costo.crearHijo(params, nodo, idNuevoNodo, visitado);
                        if (hijo != null) {
                            obtenerId();
                            nodos.push(hijo);
                            l = nodosPendientes.length;
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
                            esteril = false;
                            obtenerId();
                            nodos.push(hijo);
                            nodosPendientes.splice(1,0,hijo.id);
                        }
                    }
                    if (i == 4 && esteril) {
                        let padre = nodo.id;
                        while (nodos[nodos.length - 1].id == padre) {
                            padre = nodos[nodos.length - 1].padre;
                            console.log("Eliminando x:" + nodos[nodos.length - 1].x + ", y:" + nodos[nodos.length - 1].y)
                            idNuevoNodo -= 1;
                            nodos.pop();
                        }
                    }
                    break;
                case 4:
                    if (j == null) {
                        const hijo = Nodo.crearHijo(params, nodo, idNuevoNodo);
                        if (hijo != null) {
                            esteril = false;
                            obtenerId();
                            nodos.push(hijo);
                            l = nodosPendientes.length;
                            for (let i = 1; i < l; i++) {
                                if (nodos[nodosPendientes[i]].padre != hijo.padre) {
                                    nodosPendientes.splice(i, 0, hijo.id);
                                    break;
                                }
                            }
                            if (nodosPendientes.length == l) { nodosPendientes.push(hijo.id); }
                        }
                    }
                    if (i == 4 && esteril) {
                        eliminarNodo(nodo.id);
                        expandir(nodos[nodosPendientes[0]]);
                    }
                    function eliminarNodo(id) {
                        idNuevoNodo -= 1;
                        //console.log(nodos);
                        if (id == nodosPendientes[0]) { nodosPendientes.shift(); }
                        //console.log("Eliminando x:" + nodos[id].x + ", y:" + nodos[id].y)
                        let padre = nodos[id].padre;
                        nodos.splice(id, 1);
                        if (id == nodos.length) {
                            eliminarNodo(padre);
                        }
                        else {
                            while (id != nodos.length) {
                                nodosPendientes[0] = nodosPendientes[0] == id + 1 ? id : nodosPendientes[0];
                                nodos[id].id -= 1;
                                
                                id += 1;
                            }
                        }
                    }
                default:
            }
        }
    }
}

class Nodo {
    constructor(id, padre, y, x) {
        this.id = id;
        this.padre = padre;
        this.y = y;
        this.x = x;
    }
    static crearHijo(params, nodo, id) {
        if (params.condicion) { return null; }
        else if (laberinto[params.nuevoY][params.nuevoX] != valoresMatriz.muro) {
            return new Nodo(id, nodo.id, params.nuevoY, params.nuevoX);
        }
    }
}

class Nodo_Costo extends Nodo {
    constructor(id, padre, y, x, costoAcumulado = 0, estado = { tipo: 0, duracion: 1 }, visitado = false) {
        super(id, padre, y, x);
        this.estado = { tipo: estado.tipo, duracion: estado.duracion };
        let valorLaberinto = laberinto[y][x];
        this.nuevoCiclo = false;
        if (estado.duracion == 0) { this.estado = { tipo: 0, duracion: 1 } }
        switch (this.estado.tipo) {
            case 0: //Sin estado
                this.costo = valorLaberinto == valoresMatriz.koopa ? costosMatriz.koopa : costosMatriz.casillaLibre;
                if (valorLaberinto == valoresMatriz.estrella && !visitado) {
                    this.estado = { tipo: 1, duracion: 6 };
                    this.nuevoCiclo = true;
                }
                else if (valorLaberinto == valoresMatriz.flor && !visitado) {
                    this.estado = { tipo: 2, duracion: 1 };
                    this.nuevoCiclo = true;
                }
                break;
            case 1: //Con Estrella
                this.costo = costosMatriz.conEstrella;
                this.estado.duracion = valorLaberinto == valoresMatriz.estrella && !visitado ? this.estado.duracion + 5 : this.estado.duracion - 1;
                this.nuevoCiclo = valorLaberinto == valoresMatriz.estrella && !visitado ? true : false;

                break;
            default: //Con Flor
                this.costo = costosMatriz.casillaLibre;
                if (valorLaberinto == valoresMatriz.flor && !visitado) {
                    this.estado.duracion += 1;
                    this.nuevoCiclo = true;
                }
                else if (valorLaberinto == valoresMatriz.koopa) { this.estado.duracion -= 1; }
        }
        this.costoAcumulado = costoAcumulado + this.costo;
    }
    static crearHijo(params, nodo, id, visitado) {
        let hijo = super.crearHijo(params, nodo, id);
        return hijo == null ? hijo : new Nodo_Costo(hijo.id, hijo.padre, hijo.y, hijo.x, nodo.costoAcumulado, nodo.estado, visitado);
    }
}




//console.log(busquedas.amplitud());
//console.log(mirarLaberinto())
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
start = performance.now();
console.log(buscar(4));
end = performance.now();
console.log(`Profundidad Samuel tomó ${end - start} milisegundos`);

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