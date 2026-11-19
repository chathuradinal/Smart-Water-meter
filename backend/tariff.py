"""
National Water Supply and Drainage Board (NWSDB) Sri Lanka
Domestic Tiered (Slab) Tariff Calculator
SRS Reference: FR-04
"""

# Official NWSDB Domestic Category Rates (per m³ / unit) & Monthly Fixed Service Charges
SLAB_RATES = [
    {"limit": 5,  "rate": 60.0,  "fixed_charge": 300.0},
    {"limit": 10, "rate": 80.0,  "fixed_charge": 300.0},
    {"limit": 15, "rate": 100.0, "fixed_charge": 340.0},
    {"limit": 20, "rate": 130.0, "fixed_charge": 400.0},
    {"limit": 25, "rate": 160.0, "fixed_charge": 500.0},
    {"limit": 30, "rate": 210.0, "fixed_charge": 600.0},
    {"limit": 40, "rate": 260.0, "fixed_charge": 1200.0},
    {"limit": 50, "rate": 310.0, "fixed_charge": 1400.0},
    {"limit": 75, "rate": 360.0, "fixed_charge": 1600.0},
    {"limit": 999999, "rate": 410.0, "fixed_charge": 2000.0}
]

def calculate_nwsdb_bill(units_consumed: float) -> dict:
    """
    Computes progressive tiered water charge and applicable fixed service charge.
    units_consumed: total cubic meters (m³) consumed in billing period.
    """
    if units_consumed <= 0:
        return {
            "units": 0.0,
            "usage_charge": 0.0,
            "fixed_charge": 300.0,
            "total_bill": 300.0,
            "current_slab_rate": 60.0,
            "breakdown": []
        }
        
    remaining_units = units_consumed
    usage_charge = 0.0
    breakdown = []
    prev_limit = 0.0
    active_fixed_charge = 300.0
    active_slab_rate = 60.0
    
    for slab in SLAB_RATES:
        slab_capacity = slab["limit"] - prev_limit
        if remaining_units <= 0:
            break
            
        units_in_slab = min(remaining_units, slab_capacity)
        charge_in_slab = units_in_slab * slab["rate"]
        usage_charge += charge_in_slab
        
        breakdown.append({
            "range": f"{int(prev_limit)+1 if prev_limit > 0 else 0}-{int(slab['limit'])} units",
            "units": round(units_in_slab, 2),
            "rate_per_unit": slab["rate"],
            "amount": round(charge_in_slab, 2)
        })
        
        active_fixed_charge = slab["fixed_charge"]
        active_slab_rate = slab["rate"]
        
        remaining_units -= units_in_slab
        prev_limit = slab["limit"]
        
    total_bill = usage_charge + active_fixed_charge
    
    return {
        "units": round(units_consumed, 2),
        "usage_charge": round(usage_charge, 2),
        "fixed_charge": round(active_fixed_charge, 2),
        "total_bill": round(total_bill, 2),
        "current_slab_rate": active_slab_rate,
        "breakdown": breakdown
    }

if __name__ == "__main__":
    # Test calculation
    test_units = 18.5
    result = calculate_nwsdb_bill(test_units)
    print(f"Bill for {test_units} units: Rs. {result['total_bill']}")
    print("Breakdown:", result["breakdown"])

