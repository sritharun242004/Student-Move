"""
Location utilities for handling city and area indices.
This module provides the centralized location data and helper functions
to work with index-based city and area storage.
"""

# Centralized location data - matches frontend/constants/locations.ts
CITIES = [
    "Aberdeen",
    "Aberystwyth",
    "Bangor",
    "Bath",
    "Belfast",
    "Birmingham",
    "Bournemouth",
    "Brighton",
    "Bristol",
    "Cambridge",
    "Canterbury",
    "Cardiff",
    "Coventry",
    "Dundee",
    "Durham",
    "Edinburgh",
    "Exeter",
    "Glasgow",
    "Hertfordshire",
    "Hull",
    "Lancaster",
    "Leeds",
    "Leicester",
    "Liverpool",
    "London",
    "Loughborough",
    "Manchester",
    "Newcastle",
    "Norwich",
    "Nottingham",
    "Oxford",
    "Plymouth",
    "Portsmouth",
    "Preston",
    "Reading",
    "Sheffield",
    "Southampton",
    "St Andrews",
    "Stirling",
    "Surrey",
    "Swansea",
    "Warwick",
    "Wrexham",
    "York",
    "Sunderland",
    "Bradford",
    "Stoke-on-Trent",
    "Derby",
]

TOWNS_BY_CITY = [
    # Aberdeen (0)
    ["Bridge of Don", "City Centre", "Ferryhill", "Kingswells", "Kittybrewster", "Old Aberdeen", "Rosemount", "Torry"],
    # Aberystwyth (1)
    ["Bow Street", "Llanbadarn", "Machynlleth", "Penparcau", "Penglais", "Town Centre", "Trefechan", "University"],
    # Bangor (2)
    ["Anglesey", "Bethesda", "Caernarfon", "City Centre", "Gwynedd", "Menai Bridge", "University", "Upper Bangor"],
    # Bath (3)
    ["Bathwick", "Bear Flat", "Camden", "City Centre", "Larkhall", "Odd Down", "Oldfield Park", "Widcombe"],
    # Belfast (4)
    ["Botanic", "Cathedral Quarter", "City Centre", "Lisburn Road", "Ormeau Road", "Queen's Quarter", "Stranmillis", "Titanic Quarter"],
    # Birmingham (5)
    ["Coventry", "Dudley", "Sandwell", "Solihull", "Walsall", "West Bromwich", "Wolverhampton"],
    # Bournemouth (6)
    ["Boscombe", "Charminster", "Pokesdown", "Southbourne", "Springbourne", "Town Centre", "Westbourne", "Winton"],
    # Brighton (7)
    ["City Centre", "Fiveways", "Hanover", "Hove", "Kemptown", "North Laine", "Preston Park", "Rottingdean"],
    # Bristol (8)
    ["Clifton", "Cotham", "Easton", "Montpelier", "Redland", "Southville", "St Pauls", "Totterdown"],
    # Cambridge (9)
    ["Castle Hill", "Cherry Hinton", "Chesterton", "City Centre", "Girton", "Mill Road", "Newmarket Road", "Trumpington"],
    # Canterbury (10)
    ["Bridge", "Chartham", "City Centre", "Harbledown", "Old Dover Road", "St Dunstan's", "University", "Whitstable Road"],
    # Cardiff (11)
    ["Adamsdown", "Canton", "Cathays", "City Centre", "Heath", "Llandaff", "Pontcanna", "Roath"],
    # Coventry (12)
    ["Binley", "Canley", "City Centre", "Earlsdon", "Foleshill", "Radford", "Tile Hill", "Westwood"],
    # Dundee (13)
    ["Blackness", "Broughty Ferry", "City Centre", "Hilltown", "Lochee", "Stobswell", "Strathmartine", "West End"],
    # Durham (14)
    ["Belmont", "Carrville", "City Centre", "Framwellgate Moor", "Gilesgate", "Neville's Cross", "Newton Hall", "Ushaw Moor"],
    # Edinburgh (15)
    ["Bruntsfield", "Corstorphine", "Leith", "Marchmont", "Morningside", "Newington", "Portobello", "Stockbridge"],
    # Exeter (16)
    ["Alphington", "City Centre", "Heavitree", "Mount Pleasant", "Pennsylvania", "Pinhoe", "St David's", "St Thomas"],
    # Glasgow (17)
    ["Dennistoun", "Govan", "Maryhill", "Merchant City", "Partick", "Pollokshields", "Shawlands", "West End"],
    # Hertfordshire (18)
    ["Bishops Stortford", "Hatfield", "Hemel Hempstead", "Hertford", "St Albans", "Stevenage", "Watford", "Welwyn Garden City"],
    # Hull (19)
    ["Anlaby", "Beverley Road", "City Centre", "Cottingham", "Hessle", "Newland", "Princes Avenue", "Spring Bank"],
    # Lancaster (20)
    ["Bailrigg", "Carnforth", "City Centre", "Galgate", "Heysham", "Morecambe", "Scotforth", "University"],
    # Leeds (21)
    ["Leeds City Centre", "Holbeck", "Burley", "Woodhouse", "Hyde Park", "Headingley", "Chapel Allerton", "Meanwood", "Harehills", "Beeston", "Roundhay", "Moortown", "Alwoodley", "Horsforth", "Adel", "Pudsey", "Otley", "Morley", "Cross Gates", "Rothwell", "Garforth"],
    # Leicester (22)
    ["City Centre", "Clarendon Park", "Highfields", "Knighton", "Oadby", "Stoneygate", "West End", "Wigston"],
    # Liverpool (23)
    ["Bootle", "Crosby", "Halton", "Knowsley", "Sefton", "Southport", "St Helens", "Wirral"],
    # London (24)
    ["Brent", "Bromley", "Camden", "Croydon", "Ealing", "Greenwich", "Hackney", "Hammersmith", "Hillingdon", "Hounslow", "Islington", "Kensington", "Kingston", "Lambeth", "Lewisham", "Richmond", "Southwark", "Tower Hamlets", "Wandsworth", "Westminster"],
    # Loughborough (25)
    ["Derby Road", "Forest Road", "Lemyngton", "Nanpantan", "Shelthorpe", "Town Centre", "University", "Woodthorpe"],
    # Manchester (26)
    ["Bolton", "Bury", "Oldham", "Rochdale", "Salford", "Stockport", "Tameside", "Trafford", "Wigan"],
    # Newcastle (27)
    ["Byker", "City Centre", "Fenham", "Gosforth", "Heaton", "Jesmond", "Sandyford", "Walker"],
    # Norwich (28)
    ["Bowthorpe", "Catton", "City Centre", "Earlham", "Golden Triangle", "Hellesdon", "Thorpe", "Unthank Road"],
    # Nottingham (29)
    ["Beeston", "Hyson Green", "Lenton", "Mapperley", "Radford", "Sherwood", "The Park", "West Bridgford"],
    # Oxford (30)
    ["City Centre", "Cowley", "East Oxford", "Headington", "Iffley", "Jericho", "North Oxford", "Summertown"],
    # Plymouth (31)
    ["City Centre", "Devonport", "Lipson", "Mutley", "Peverell", "Plympton", "Plymstock", "Stonehouse"],
    # Portsmouth (32)
    ["City Centre", "Cosham", "Fratton", "Gunwharf", "Milton", "Old Portsmouth", "Southsea", "Waterlooville"],
    # Preston (33)
    ["Ashton", "City Centre", "Fulwood", "Ingol", "Lea", "Penwortham", "Ribbleton", "University"],
    # Reading (34)
    ["Calcot", "Caversham", "Earley", "Tilehurst", "Town Centre", "University", "Wokingham", "Woodley"],
    # Sheffield (35)
    ["Broomhill", "City Centre", "Crookes", "Ecclesall", "Heeley", "Hillsborough", "Kelham Island", "Walkley"],
    # Southampton (36)
    ["Bassett", "Bedford Place", "City Centre", "Highfield", "Ocean Village", "Polygon", "Portswood", "Shirley"],
    # St Andrews (37)
    ["Bell Street", "Hepburn Gardens", "Hope Street", "Market Street", "North Street", "Scores", "South Street", "Town Centre"],
    # Stirling (38)
    ["Bannockburn", "Bridge of Allan", "Cambusbarron", "Causewayhead", "City Centre", "Dunblane", "St Ninians", "University"],
    # Surrey (39)
    ["Camberley", "Epsom", "Farnham", "Guildford", "Leatherhead", "Redhill", "Reigate", "Woking"],
    # Swansea (40)
    ["Brynmill", "City Centre", "Mount Pleasant", "Mumbles", "Sketty", "St Thomas", "Townhill", "Uplands"],
    # Warwick (41)
    ["Cubbington", "Heathcote", "Kenilworth", "Leamington Spa", "Town Centre", "University", "Whitnash", "Woodloes"],
    # Wrexham (42)
    ["Chirk", "Gresford", "Llangollen", "Marford", "Rossett", "Ruabon", "Town Centre", "University"],
    # York (43)
    ["Acomb", "City Centre", "Clifton", "Dringhouses", "Fulford", "Heslington", "Heworth", "Tang Hall"],
    # Sunderland (44)
    ["City Centre", "Hendon", "Roker", "Fulwell", "Monkwearmouth", "Southwick", "Whitburn", "Washington"],
    # Bradford (45)
    ["City Centre", "Manningham", "Heaton", "Bolton", "Eccleshill", "Shipley", "Bingley", "Ilkley"],
    # Stoke-on-Trent (46)
    ["City Centre", "Hanley", "Fenton", "Longton", "Stoke", "Newcastle-under-Lyme", "Kidsgrove", "Biddulph"],
    # Derby (47)
    ["City Centre", "Allestree", "Chaddesden", "Mackworth", "Littleover", "Chellaston", "Spondon", "Oakwood"],
]


class LocationValidator:
    """Validator for city and area indices."""
    
    @staticmethod
    def validate_city_index(city_index):
        """
        Validate that the city index is within valid range.
        
        Args:
            city_index (int): The city index to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        return 0 <= city_index < len(CITIES)
    
    @staticmethod
    def validate_area_index(city_index, area_index):
        """
        Validate that the area index is valid for the given city.
        
        Args:
            city_index (int): The city index
            area_index (int): The area index to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not LocationValidator.validate_city_index(city_index):
            return False
        return 0 <= area_index < len(TOWNS_BY_CITY[city_index])
    
    @staticmethod
    def validate_city_area_relationship(city_index, area_index):
        """
        Validate that the city and area indices form a valid relationship.
        
        Args:
            city_index (int): The city index
            area_index (int): The area index
            
        Returns:
            bool: True if the relationship is valid, False otherwise
        """
        return (LocationValidator.validate_city_index(city_index) and 
                LocationValidator.validate_area_index(city_index, area_index))


class LocationHelper:
    """Helper functions for working with location data."""
    
    @staticmethod
    def get_city_name(city_index):
        """
        Get the city name from its index.
        
        Args:
            city_index (int): The city index
            
        Returns:
            str: The city name, or "Unknown City" if index is invalid
        """
        if LocationValidator.validate_city_index(city_index):
            return CITIES[city_index]
        return "Unknown City"
    
    @staticmethod
    def get_area_name(city_index, area_index):
        """
        Get the area name from city and area indices.
        
        Args:
            city_index (int): The city index
            area_index (int): The area index
            
        Returns:
            str: The area name, or "Unknown Area" if indices are invalid
        """
        if LocationValidator.validate_area_index(city_index, area_index):
            return TOWNS_BY_CITY[city_index][area_index]
        return "Unknown Area"
    
    @staticmethod
    def find_city_index_by_name(city_name):
        """
        Find the city index by name.
        
        Args:
            city_name (str): The city name to search for
            
        Returns:
            int: The city index, or -1 if not found
        """
        try:
            return CITIES.index(city_name)
        except ValueError:
            return -1
    
    @staticmethod
    def find_area_index_by_name(city_index, area_name):
        """
        Find the area index by name within a city.
        
        Args:
            city_index (int): The city index
            area_name (str): The area name to search for
            
        Returns:
            int: The area index, or -1 if not found
        """
        if not LocationValidator.validate_city_index(city_index):
            return -1
        try:
            return TOWNS_BY_CITY[city_index].index(area_name)
        except ValueError:
            return -1
    
    @staticmethod
    def get_valid_areas_for_city(city_index):
        """
        Get the list of valid area names for a given city.
        
        Args:
            city_index (int): The city index
            
        Returns:
            list: List of area names for the city, or empty list if invalid
        """
        if LocationValidator.validate_city_index(city_index):
            return TOWNS_BY_CITY[city_index].copy()
        return []
    
    @staticmethod
    def get_location_display(city_index, area_index):
        """
        Get a formatted display string for a location.
        
        Args:
            city_index (int): The city index
            area_index (int): The area index
            
        Returns:
            str: Formatted location string (e.g., "Kensington, London")
        """
        city_name = LocationHelper.get_city_name(city_index)
        area_name = LocationHelper.get_area_name(city_index, area_index)
        return f"{area_name}, {city_name}"


class LegacyLocationMapper:
    """Helper for mapping legacy database City/Area objects to indices."""
    
    @staticmethod
    def map_city_to_index(city_obj):
        """
        Map a legacy City object to its index.
        
        Args:
            city_obj: Django City model instance
            
        Returns:
            int: The city index, or 0 as fallback
        """
        if hasattr(city_obj, 'name'):
            index = LocationHelper.find_city_index_by_name(city_obj.name)
            return index if index != -1 else 0
        return 0
    
    @staticmethod
    def map_area_to_index(area_obj, city_index):
        """
        Map a legacy Area object to its index within a city.
        
        Args:
            area_obj: Django Area model instance
            city_index (int): The city index
            
        Returns:
            int: The area index, or 0 as fallback
        """
        if hasattr(area_obj, 'name'):
            index = LocationHelper.find_area_index_by_name(city_index, area_obj.name)
            return index if index != -1 else 0
        return 0
