package fixture;

import org.springframework.stereotype.Service;

@Service
public class StatusService {
    public String status() { return "ready"; }
}
