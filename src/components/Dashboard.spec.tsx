import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Dashboard from '@/components/Dashboard';
import type { Deploy, Incident } from '@/lib/types';

const ASOF = '2026-07-24';

function deploy(overrides: Partial<Deploy>): Deploy {
  return {
    enablerId: '000000',
    data: '2026-06-01',
    titulo: 'deploy',
    bugsAntes: 0,
    incidentesPos: 0,
    dre: null,
    causouIncidente: 0,
    falseAlarms: null,
    ...overrides,
  };
}

function incident(overrides: Partial<Incident>): Incident {
  return {
    id: '000000',
    titulo: 'incident',
    severity: 2,
    state: 'Closed',
    created: '2026-06-01',
    closed: null,
    deployTag: null,
    mttrDias: null,
    ...overrides,
  };
}

const deploys: Deploy[] = [
  deploy({
    enablerId: '390722',
    data: '2026-05-05',
    causouIncidente: 1,
    falseAlarms: 2,
  }),
  deploy({
    enablerId: '394210',
    data: '2026-05-25',
    causouIncidente: 0,
    falseAlarms: 1,
  }),
  deploy({
    enablerId: '395747',
    data: '2026-06-15',
    causouIncidente: 1,
    falseAlarms: 0,
  }),
  deploy({
    enablerId: '397800',
    data: '2026-07-05',
    causouIncidente: 0,
    falseAlarms: 3,
  }),
  deploy({
    enablerId: '399120',
    data: '2026-07-22',
    causouIncidente: 1,
    falseAlarms: null,
  }),
];

const incidents: Incident[] = [
  incident({
    id: 'A',
    severity: 1,
    created: '2026-06-01',
    closed: '2026-06-01',
    mttrDias: 0,
  }),
  incident({
    id: 'B',
    severity: 2,
    created: '2026-06-01',
    closed: '2026-06-11',
    mttrDias: 10,
  }),
  incident({
    id: 'C',
    severity: 3,
    created: '2026-06-01',
    closed: '2026-06-15',
    mttrDias: 14,
  }),
  incident({
    id: 'D',
    severity: 4,
    created: '2026-06-01',
    closed: '2026-06-05',
    mttrDias: 4,
  }),
  incident({
    id: 'E',
    severity: 2,
    created: '2026-05-01',
    closed: null,
    mttrDias: null,
  }),
];

function renderDashboard() {
  return render(
    <Dashboard
      deploys={deploys}
      incidents={incidents}
      asOf={ASOF}
    />,
  );
}

function descriptionRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Descrição da métrica' });
}

function selectMetric(name: string): void {
  fireEvent.click(screen.getByRole('tab', { name }));
}

describe('Dashboard metric tabs', () => {
  it('renders a tablist with exactly the four metric tabs', () => {
    renderDashboard();
    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'DRE',
      'CFR',
      'MTTR',
      'False Alarm',
    ]);
  });

  it('marks DRE as the active tab on first render', () => {
    renderDashboard();
    expect(screen.getByRole('tab', { name: 'DRE' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'CFR' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders the DRE chart figure and description on first render', () => {
    renderDashboard();
    expect(screen.getByRole('img', { name: /DRE/ })).toBeInTheDocument();
    expect(descriptionRegion()).toHaveTextContent(/DRE/);
  });

  it('activates the clicked tab and deactivates the previous one', () => {
    renderDashboard();
    selectMetric('CFR');
    expect(screen.getByRole('tab', { name: 'CFR' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'DRE' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});

describe('Dashboard metric switching', () => {
  it('switching to CFR changes the chart label and the description text', () => {
    renderDashboard();
    const before = descriptionRegion().textContent;
    selectMetric('CFR');
    expect(screen.getByRole('img', { name: /CFR/ })).toBeInTheDocument();
    expect(descriptionRegion()).toHaveTextContent(/CFR/);
    expect(descriptionRegion().textContent).not.toBe(before);
  });

  it('switching to MTTR changes the chart label and the description text', () => {
    renderDashboard();
    const before = descriptionRegion().textContent;
    selectMetric('MTTR');
    expect(screen.getByRole('img', { name: /MTTR/ })).toBeInTheDocument();
    expect(descriptionRegion()).toHaveTextContent(/MTTR/);
    expect(descriptionRegion().textContent).not.toBe(before);
  });

  it('switching to False Alarm changes the chart label and the description text', () => {
    renderDashboard();
    const before = descriptionRegion().textContent;
    selectMetric('False Alarm');
    expect(
      screen.getByRole('img', { name: /False Alarm/i }),
    ).toBeInTheDocument();
    expect(descriptionRegion()).toHaveTextContent(/alarm/i);
    expect(descriptionRegion().textContent).not.toBe(before);
  });
});

describe('Dashboard period selector', () => {
  it('exposes a Período combobox that defaults to the whole period', () => {
    renderDashboard();
    const select = screen.getByRole('combobox', { name: 'Período' });
    expect(
      within(select).getByRole('option', { name: 'Todo o período' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mostrando todos os deploys/i)).toBeInTheDocument();
  });

  it('reduces the visible deploy count to 3 when Últimos 3 deploys is chosen', () => {
    renderDashboard();
    const select = screen.getByRole('combobox', { name: 'Período' });
    const option = screen.getByRole('option', {
      name: 'Últimos 3 deploys',
    }) as HTMLOptionElement;
    fireEvent.change(select, { target: { value: option.value } });
    expect(
      screen.getByText(/Mostrando os últimos 3 deploys/i),
    ).toBeInTheDocument();
  });
});

describe('Dashboard chart caption', () => {
  it('shows both MTTR severity series in the caption', () => {
    renderDashboard();
    selectMetric('MTTR');
    expect(screen.getByText(/Sev 1-2/)).toBeInTheDocument();
    expect(screen.getByText(/Sev 3-4/)).toBeInTheDocument();
  });

  it('marks the latest CFR window as partial in the caption', () => {
    renderDashboard();
    selectMetric('CFR');
    expect(screen.getByText(/parcial/i)).toBeInTheDocument();
  });
});
