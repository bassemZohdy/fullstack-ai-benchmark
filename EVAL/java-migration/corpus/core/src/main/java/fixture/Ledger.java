package fixture;

public class Ledger {
    public int total(int first, int second) { return first + second; }
    public int divide(int amount, int count) {
        if (count == 0) throw new IllegalArgumentException("count");
        return amount / count;
    }
    private void internal() {}
    class Nested { public void nestedOnly() {} }
}
