package fixture;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class LedgerTest {
    @Test public void sumsBothInputs() { assertEquals(5, new Ledger().total(2, 3)); }
    @Test public void dividesExactly() { assertEquals(3, new Ledger().divide(9, 3)); }
    @Test(expected = IllegalArgumentException.class)
    public void rejectsZeroCount() { new Ledger().divide(9, 0); }
}
