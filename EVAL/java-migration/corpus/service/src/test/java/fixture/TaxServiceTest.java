package fixture;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class TaxServiceTest {
    @Test void usesInjectedRate() {
        TaxService.RateStore store = mock(TaxService.RateStore.class);
        when(store.rate()).thenReturn(3);
        assertEquals(15, new TaxService(store).tax(5));
        verify(store).rate();
    }
    @Test void returnsStatus() { assertEquals("ready", new StatusService().status()); }
}
