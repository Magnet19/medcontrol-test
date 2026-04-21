import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParametersForm } from './ParametersForm';

describe('<ParametersForm />', () => {
  it('renders three inputs (string, number, date) for a three-field schema', () => {
    render(
      <ParametersForm
        schema={{
          name: { type: 'string', label: 'Name', required: true },
          age: { type: 'number', label: 'Age', required: true },
          day: { type: 'date', label: 'Day', required: true },
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).type).toBe('text');
    expect((screen.getByLabelText(/Age/) as HTMLInputElement).type).toBe('number');
    expect((screen.getByLabelText(/Day/) as HTMLInputElement).type).toBe('date');
  });

  it('blocks submit when a required field is empty', async () => {
    const onSubmit = vi.fn();
    render(
      <ParametersForm
        schema={{ name: { type: 'string', label: 'Name', required: true } }}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Запустить/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/обязательно/)).toBeInTheDocument();
  });

  it('calls onSubmit with the entered values when valid', async () => {
    const onSubmit = vi.fn();
    render(
      <ParametersForm
        schema={{ name: { type: 'string', label: 'Name', required: true } }}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByLabelText(/Name/) as HTMLInputElement;
    await userEvent.type(input, 'Alice');
    expect(input.value).toBe('Alice');
    await userEvent.click(screen.getByRole('button', { name: /Запустить/ }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' });
  });
});
