import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
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
  private dpr = 1;
  private resizeObserver?: ResizeObserver;
  private pendingFullRender = false;
  private destroyed = false;

  private imgFreeSeat = new Image();
  private imgFilledSeat = new Image();

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.imgFreeSeat.src = 'assets/icon/free-seat.svg';
    this.imgFilledSeat.src = 'assets/icon/filled-seat.svg';

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;

    // Run non-Angular to avoid change detection
    this.ngZone.runOutsideAngular(() => {
      this.setupResizeObserver();
      // initial sizing + draw
      this.onResize();
      this.imgFreeSeat.onload = this.imgFilledSeat.onload = () => {
        this.onResize(); // redraw once images are ready
      };
    });
  }

  // ---------- Resizing & DPI ----------
  private setupResizeObserver() {
    const canvas = this.canvasRef.nativeElement;
    // Use ResizeObserver to track CSS size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.requestFullRender();
    });
    this.resizeObserver.observe(canvas);
    // Also watch window resize to be safe
    window.addEventListener('resize', this.windowResizeHandler, {
      passive: true,
    });
  }

  private windowResizeHandler = () => {
    this.requestFullRender();
  };

  private requestFullRender() {
    if (this.destroyed) return;
    if (this.pendingFullRender) return;
    this.pendingFullRender = true;
    // Batch using requestAnimationFrame
    requestAnimationFrame(() => {
      this.pendingFullRender = false;
      this.onResize();
    });
  }

  private onResize() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // devicePixelRatio for crisp rendering
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

    // set the canvas backing store size in device pixels
    const newWidth = Math.round(rect.width * this.dpr);
    const newHeight = Math.round(rect.height * this.dpr);

    // Avoid needless reallocation
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
    }

    // Reset transform so we start known state, then scale such that one unit == 1 CSS px.
    // After this transform, drawing commands use CSS pixels (easier math).
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Set crisp borders regardless of dpr
    this.ctx.lineWidth = 1 / this.dpr;
  }
}
