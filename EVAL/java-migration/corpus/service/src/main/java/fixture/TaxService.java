package fixture;

public class TaxService {
    private final RateStore store;
    public TaxService(RateStore store) { this.store = store; }
    public int tax(int amount) { return amount * store.rate(); }
    public interface RateStore { int rate(); }
}
