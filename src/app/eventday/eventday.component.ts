import { Component, Input } from '@angular/core';

/**
 * Componente que maneja la visualización de eventos en un día del calendario.
 * Se encarga de ajustar el ancho de los bloques de eventos según su duración
 * y responde a cambios en el tamaño de la ventana.
 */
@Component({
  selector: 'app-eventday',
  templateUrl: './eventday.component.html',
  styleUrls: ['./eventday.component.css'],
  host: {
    // Escucha el evento de redimensionamiento de ventana
    '(window:resize)': 'onResize($event)'
  }
})
export class EventdayComponent {
  /**
   * Array de eventos del día que contiene información como:
   * - nameProject: nombre del proyecto
   * - date_start: fecha de inicio del evento
   * - date_end: fecha de fin del evento
   */
  @Input() dia: any;

  /**
   * Hook del ciclo de vida que se ejecuta después de inicializar la vista.
   * Ajusta el ancho de los bloques de eventos según su duración en días.
   */
  ngAfterViewInit() {
    // Si no hay eventos en el día, salir
    if (this.dia.length == 0) return;
    console.log(this.dia)

    // Obtener todos los elementos con clase "block" (bloques de eventos)
    let blocks = document.getElementsByClassName("block");

    // Obtener la celda (td) padre que contiene los bloques
    let td = blocks[0].closest("td");

    // Iterar por cada evento del día
    for (let ievent = 0; ievent < this.dia.length; ievent++) {

      // Obtener solo la primera palabra del nombre del proyecto
      let firstWord = this.dia[ievent].nameProject.split(' ')[0];

      // Iterar por cada bloque en el DOM
      for (let iblock = 0; iblock < blocks.length; iblock++) {
        // Comparar el texto del bloque con el nombre del proyecto del evento
        if (blocks[iblock].textContent?.trim() == firstWord.trim()) {
          // Obtener las fechas de inicio y fin del evento
          let start = new Date(this.dia[ievent].date_start);
          let end = new Date(this.dia[ievent].date_end);

          // Calcular la cantidad de días que dura el evento
          let n = end.getDate() - start.getDate();

          // Si la celda tiene un ancho definido
          if (td?.offsetWidth != undefined) {
            // Ajustar el ancho del bloque multiplicando el ancho de la celda por la duración en días
            blocks[iblock].setAttribute("style", "width:" + (td?.offsetWidth * n) + "px");
          }
        }
      }
    }
  }

  /**
   * Maneja el evento de redimensionamiento de ventana.
   * Recalcula el ancho de los bloques de eventos para ajustarse al nuevo tamaño.
   * @param event Evento de redimensionamiento de ventana
   */
  onResize(event: any) {
    // Si no hay eventos en el día, salir
    if (this.dia.length == 0) return;

    // Obtener todos los elementos con clase "block" (bloques de eventos)
    let blocks = document.getElementsByClassName("block");

    // Obtener la celda (td) padre que contiene los bloques
    let td = blocks[0].closest("td");

    // Iterar por cada evento del día
    for (let ievent = 0; ievent < this.dia.length; ievent++) {

      // Obtener solo la primera palabra del nombre del proyecto
      let firstWord = this.dia[ievent].nameProject.split(' ')[0];

      // Iterar por cada bloque en el DOM
      for (let iblock = 0; iblock < blocks.length; iblock++) {
        // Comparar el texto del bloque con el nombre del proyecto del evento
        if (blocks[iblock].textContent?.trim() == firstWord.trim()) {
          // Obtener las fechas de inicio y fin del evento
          let start = new Date(this.dia[ievent].date_start);
          let end = new Date(this.dia[ievent].date_end);

          // Calcular la cantidad de días que dura el evento
          let n = end.getDate() - start.getDate();

          // Si la celda tiene un ancho definido
          if (td?.offsetWidth != undefined) {
            // Ajustar el ancho del bloque multiplicando el ancho de la celda por la duración en días
            blocks[iblock].setAttribute("style", "width:" + (td?.offsetWidth * n) + "px");
          }
        }
      }
    }
  }
}
