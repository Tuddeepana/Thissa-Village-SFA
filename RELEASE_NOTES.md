# Release Notes: Room Type Configuration Update

We are excited to announce the latest update to the Thissa Village SFA! This release introduces dynamic **Room Type Configuration**, providing you with complete control over room categorization and pricing. 

## 🌟 New Features

### 1. Dynamic Room Type Management
- **New Configuration Page:** A dedicated "Room Types" page has been added to the Hotel Management sidebar.
- **Custom Room Types:** You can now create, edit, and delete custom room types (e.g., VIP, Normal, Deluxe, Double Bed) rather than being limited to hardcoded options.
- **Flexible Pricing:** Set unique **Full Day Prices** and **Short Time Prices** individually for each room type.
- **Descriptions:** Add custom descriptions to keep your staff informed about the specific amenities of each room type.

### 2. Upgraded Room Creation & Editing
- When adding or editing a room in the **Rooms** section, the "Room Type" dropdown will now dynamically load the custom types you have created in the database.
- Easily assign or reassign any custom room type to your physical rooms.

### 3. Smarter Booking & POS
- **Dynamic Badges:** The Room Booking Dialog now visually displays the exact custom name of the room type you assigned (e.g., instead of just checking for "VIP").
- **Accurate Pricing:** The booking calculator automatically fetches the correct Full Day or Short Time price associated with the dynamically selected room type.

## 🛠️ Getting Started
1. **Configure Your Types:** Navigate to the **Room Types** page via the sidebar. A default "Normal" type has already been generated for you. Add any additional types like "VIP" or "Deluxe" here!
2. **Assign Types to Rooms:** Go to the **Rooms** page and edit your existing rooms to assign them to your newly created custom Room Types.
3. **Start Booking:** Open the Booking POS. You'll notice your custom room types and their respective pricing are immediately available for selection!

*(Note: For the system administrators, please ensure both the frontend and backend servers have been restarted to apply the recent database schema upgrades).*
