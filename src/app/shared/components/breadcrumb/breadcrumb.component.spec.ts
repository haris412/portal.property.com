import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  async function createFixture(items: BreadcrumbItem[] = []): Promise<ComponentFixture<BreadcrumbComponent>> {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent, RouterModule.forRoot([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(BreadcrumbComponent);
    fixture.componentInstance.items = items;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    const fixture = await createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all breadcrumb items', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', route: '/' },
      { label: 'Users', route: '/users' },
      { label: 'Profile' },
    ];
    const fixture = await createFixture(items);

    const listItems = fixture.nativeElement.querySelectorAll('.breadcrumb-item');
    expect(listItems.length).toBe(3);
  });

  it('should render links for items with route (except last)', async () => {
    const fixture = await createFixture([
      { label: 'Home', route: '/' },
      { label: 'Current' },
    ]);

    const link = fixture.nativeElement.querySelector('.breadcrumb-link');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('Home');
  });

  it('should render current item as span (no link)', async () => {
    const fixture = await createFixture([
      { label: 'Home', route: '/' },
      { label: 'Current Page' },
    ]);

    const spans = fixture.nativeElement.querySelectorAll('.breadcrumb-current');
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[spans.length - 1].textContent.trim()).toBe('Current Page');
  });

  it('should show separators between items', async () => {
    const fixture = await createFixture([
      { label: 'A', route: '/' },
      { label: 'B', route: '/b' },
      { label: 'C' },
    ]);

    const separators = fixture.nativeElement.querySelectorAll('.breadcrumb-separator');
    expect(separators.length).toBe(2);
  });

  it('should not show separator after last item', async () => {
    const fixture = await createFixture([{ label: 'Only' }]);

    const separators = fixture.nativeElement.querySelectorAll('.breadcrumb-separator');
    expect(separators.length).toBe(0);
  });
});
