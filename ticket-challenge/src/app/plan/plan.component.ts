import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

const GRID = 15; // 15x15
const TOTAL_CELLS = GRID * GRID;

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // Compact state: 0 = free, 1 = reserved
  private state = new Uint8Array(TOTAL_CELLS);

  private ctx!: CanvasRenderingContext2D;

  private imgFreeSeat = new Image();
  private imgFilledSeat = new Image();

  ngAfterViewInit(): void {
    this.imgFreeSeat.src = 'assets/icon/free-seat.svg';
    this.imgFilledSeat.src = 'assets/icon/filled-seat.svg';

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
  }
}
