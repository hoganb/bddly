import { registerStep } from '.';

export function given<G>(precondition: () => Promise<G>): Given<G> {
  return new Given(null, precondition);
}

class Given<Current, Previous = unknown> {
  constructor(private previous: Given<Previous, any> | null, private precondition: (state: Previous) => Promise<Current>) {}

  and<Next>(precondition: (state: Current) => Promise<Next>): Given<Next, Current> {
    return new Given(this, precondition);
  }

  when<Next>(action: (state: Current) => Promise<Next>): When<Next, Current> {
    return new When(this, action);
  }

  async _run(): Promise<Current> {
    if (this.previous) {
      const state = await this.previous._run();
      registerStep('And', this.precondition);
      return this.precondition(state);
    } else {
      const state = null as unknown as Previous;
      registerStep('Given', this.precondition);
      return this.precondition(state);
    }
  }
}

class When<Current, Previous> {
  constructor(private given: Given<Previous, any>, private action: (state: Previous) => Promise<Current>) {}

  then<Next>(assertion: (state: Current) => Promise<Next>): Then<Next, Current> {
    return new Then(this, assertion);
  }

  async _run(): Promise<Current> {
    const state: Previous = await this.given._run();
    registerStep('When', this.action);
    return this.action(state);
  }
}

class Then<Current, Previous> {
  constructor(private when: When<Previous, any>, private assertion: (state: Previous) => Promise<Current>) {}

  async run(): Promise<void> {
    const state: Previous = await this.when._run();
    registerStep('Then', this.assertion);
    await this.assertion(state);
  }
}
