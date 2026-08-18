import { Component, Input, ElementRef, AfterViewInit, HostListener } from '@angular/core';

/**
 * Componente que maneja la visualización de eventos en un día del calendario.
 * Se encarga de ajustar el ancho de los bloques de eventos según su duración
 * y responde a cambios en el tamaño de la ventana.
 */
@Component({
  selector: 'app-eventday',
  templateUrl: './eventday.component.html',
  styleUrls: ['./eventday.component.css']
})
export class EventdayComponent implements AfterViewInit {
  @Input() dia: any[] = [];
  @Input() year!: number;
  @Input() month!: number;
  cellWidth: number = 70; // Matches the default width from home.component.css (70px)

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateCellWidth();
    }, 0);
  }

  @HostListener('window:resize')
  onResize() {
    this.updateCellWidth();
  }

  updateCellWidth() {
    const parent = this.elementRef.nativeElement.parentElement;
    if (parent && parent.offsetWidth > 0) {
      this.cellWidth = parent.offsetWidth;
    }
  }

  getEventWidth(event: any): number {
    if (!event || !event.date_start || !event.date_end || this.year === undefined || this.month === undefined) return 0;
    
    const start = new Date(event.date_start);
    const end = new Date(event.date_end);
    
    const monthStart = new Date(this.year, this.month, 1, 0, 0, 0);
    
    // Visual start is the actual start or the month start
    const visualStart = start < monthStart ? monthStart : start;
    
    // Clear hours to calculate clean calendar day difference
    const dStart = new Date(visualStart.getFullYear(), visualStart.getMonth(), visualStart.getDate());
    const dEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    const diffTime = dEnd.getTime() - dStart.getTime();
    let n = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (n <= 0) {
      n = 1;
    }
    
    // Cap the width to the remaining days in the month to avoid overflow
    const lastDay = new Date(this.year, this.month + 1, 0).getDate();
    const remainingDays = lastDay - visualStart.getDate() + 1;
    if (n > remainingDays) {
      n = remainingDays;
    }
    
    // Spacing separation: subtract 4px so adjacent blocks do not touch
    // (We also have left: 2px in CSS, leaving 2px on the right and left)
    return (this.cellWidth * n) - 4;
  }
}
