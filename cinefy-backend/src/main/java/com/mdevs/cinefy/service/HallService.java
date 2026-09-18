package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.hall.HallDTO;
import com.mdevs.cinefy.dto.hall.HallDetailDTO;
import com.mdevs.cinefy.dto.hall.HallLayout;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.projection.hall.HallStatusCountProjection;
import com.mdevs.cinefy.dto.hall.HallSummaryDTO;
import com.mdevs.cinefy.dto.hall.HallTypeDTO;
import com.mdevs.cinefy.dto.hall.SeatLayoutDTO;
import com.mdevs.cinefy.dto.hall.TicketPricingDTO;
import com.mdevs.cinefy.entity.*;
import com.mdevs.cinefy.entity.enums.*;
import com.mdevs.cinefy.repository.HallRepository;
import com.mdevs.cinefy.repository.HallTypeRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;

    private final HallTypeRepository hallTypeRepository;

    private final ShowtimeRepository showtimeRepository;

    private static final int MAX_GRID_DIMENSION = 50;

    private static final Pattern POSITION_PATTERN = Pattern.compile("^([A-Z]+)([0-9]+)$");

    public static final Comparator<String> POSITION_COMPARATOR =
            Comparator.comparingInt(HallService::positionRowIndex)
                    .thenComparingInt(HallService::positionColumnNumber);

    // ========================= Hall Types =========================

    public List<HallTypeDTO> getHallTypes() {
        return hallTypeRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(ht -> {
                    HallTypeDTO dto = new HallTypeDTO();
                    dto.setId(ht.getUuid());
                    dto.setName(ht.getName());
                    return dto;
                })
                .toList();
    }

    @Transactional
    public HallTypeDTO createHallType(HallTypeDTO dto) {
        validateHallType(dto.getName(), null);
        HallType hallType = new HallType(dto.getName());
        hallTypeRepository.save(hallType);
        dto.setId(hallType.getUuid());
        return dto;
    }

    @Transactional
    public HallTypeDTO updateHallType(String uuid, HallTypeDTO dto) {
        HallType hallType = findHallType(uuid);
        validateHallType(dto.getName(), hallType.getId());
        hallType.setName(dto.getName());
        hallType.setCode(HallType.toCode(dto.getName()));
        hallTypeRepository.save(hallType);
        dto.setId(hallType.getUuid());
        return dto;
    }

    @Transactional
    public void deleteHallType(String uuid) {
        HallType hallType = findHallType(uuid);
        if (hallRepository.existsByType(hallType)) {
            throw new BusinessException("Cannot delete this hall type because it is assigned to one or more halls");
        }
        hallTypeRepository.delete(hallType);
    }

    // ============================= Halls ===========================

    public List<HallSummaryDTO> getHalls(String excludeHallId, List<String> statuses) {
        List<HallStatus> hallStatuses = statuses != null && !statuses.isEmpty() ? statuses.stream().map(HallStatus::fromString).toList() : null;
        return hallRepository.findAllFiltered(excludeHallId, hallStatuses).stream()
                .map(this::toSummaryDTO)
                .toList();
    }

    public HallDetailDTO getHall(String uuid) {
        Hall hall = findHallWithType(uuid);

        HallTypeDTO type = new HallTypeDTO();
        type.setId(hall.getType().getUuid());
        type.setName(hall.getType().getName());

        HallDetailDTO dto = new HallDetailDTO();
        dto.setId(hall.getUuid());
        dto.setName(hall.getName());
        dto.setNumberOfRows(hall.getTotalRows());
        dto.setSeatsPerRow(hall.getTotalColumns());
        dto.setStatus(hall.getStatus().name());
        dto.setType(type);
        dto.setSupports3D(hall.isSupports3D());
        dto.setLayout(toLayoutMap(hall));
        dto.setTicketPricing(toPricingList(hall));
        return dto;
    }

    public HallLayoutDTO getHallLayout(String uuid) {
        return getHallLayout(findHallWithType(uuid));
    }

    public Map<HallStatus, Long> getHallStatusCounts() {
        Map<HallStatus, Long> counts = new EnumMap<>(HallStatus.class);
        for (HallStatus status : HallStatus.values()) {
            counts.put(status, 0L);
        }

        for (HallStatusCountProjection projection : hallRepository.countByStatus()) {
            counts.put(projection.status(), projection.total());
        }
        return counts;
    }

    @Transactional
    public HallSummaryDTO createHall(HallDTO dto) {
        validateHall(dto, null);

        Hall hall = new Hall(dto.getName());
        applyDtoToHall(hall, dto);

        hallRepository.save(hall);
        return toSummaryDTO(hall);
    }

    @Transactional
    public HallSummaryDTO updateHall(String uuid, HallDTO dto) {
        Hall hall = findHallWithType(uuid);
        validateHall(dto, hall.getId());
        validateHallMutability(hall, dto);

        hall.setName(dto.getName());
        hall.setCode(Hall.toCode(dto.getName()));
        applyDtoToHall(hall, dto);
        hallRepository.save(hall);

        return toSummaryDTO(hall);
    }

    @Transactional
    public void updateHallStatus(Hall hall, HallStatus status) {
        if (hall.getStatus().equals(status)) return;
        hall.setStatus(status);
        hallRepository.save(hall);
    }

    @Transactional
    public void deleteHall(String uuid) {
        Hall hall = findHallWithType(uuid);
        if (showtimeRepository.existsByHall(hall)) {
            throw new BusinessException("Cannot delete this hall while it has showtimes");
        }
        hallRepository.delete(hall);
    }

    // =========================== Helpers ===========================

    public Hall findHallWithType(String uuid) {
        return hallRepository.findByUuidWithType(uuid).orElseThrow(() -> new NotFoundException("Hall not found with id: " + uuid));
    }

    public boolean isSeatInGrid(Hall hall, String position) {
        Matcher matcher = POSITION_PATTERN.matcher(position);
        if (!matcher.matches()) {
            return false;
        }
        int rowIndex = toRowIndex(matcher.group(1));
        int colNumber = Integer.parseInt(matcher.group(2));
        return rowIndex >= 1 && rowIndex <= hall.getTotalRows() && colNumber >= 1 && colNumber <= hall.getTotalColumns();
    }

    private HallType findHallType(String uuid) {
        return hallTypeRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Hall type not found with id: " + uuid));
    }

    private void validateHallType(String name, Long excludeId) {
        String code = HallType.toCode(name);
        boolean exists = excludeId == null ? hallTypeRepository.existsByCode(code) : hallTypeRepository.existsByCodeAndIdNot(code, excludeId);
        if (exists) {
            throw new BusinessException("A hall type with a similar name to '" + name + "' already exists");
        }
    }

    private void validateHall(HallDTO dto, Long excludeId) {
        String code = Hall.toCode(dto.getName());
        boolean exists = excludeId == null ? hallRepository.existsByCode(code) : hallRepository.existsByCodeAndIdNot(code, excludeId);
        if (exists) {
            throw new BusinessException("A hall with a similar name to '" + dto.getName() + "' already exists");
        }

        if (dto.getNumberOfRows() > MAX_GRID_DIMENSION || dto.getSeatsPerRow() > MAX_GRID_DIMENSION) {
            throw new BusinessException("Number of rows and seats per row cannot exceed " + MAX_GRID_DIMENSION);
        }

        Map<String, List<String>> categories = dto.getLayout() != null ? dto.getLayout().getCategories() : null;
        if (categories != null) {
            int totalSeats = dto.getNumberOfRows() * dto.getSeatsPerRow();
            int aisleSeats = categories.getOrDefault(SeatCategory.AISLE.name(), Collections.emptyList()).size();
            if (aisleSeats == totalSeats) {
                throw new BusinessException("A hall cannot have all seats designated as aisles");
            }
        }

        Set<SeatCategory> pricedCategories = EnumSet.noneOf(SeatCategory.class);
        for (TicketPricingDTO pricing : dto.getTicketPricing()) {
            SeatCategory category = SeatCategory.fromString(pricing.getSeatCategory());
            if (!pricedCategories.add(category)) {
                throw new BusinessException("Duplicate seat category entry: " + pricing.getSeatCategory());
            }
            if (category.equals(SeatCategory.AISLE)) {
                throw new BusinessException("Aisle seats cannot have a ticket price");
            }
        }

        Set<SeatCategory> requiredCategories = EnumSet.noneOf(SeatCategory.class);
        if (categories != null) {
            int totalSeats = dto.getNumberOfRows() * dto.getSeatsPerRow();
            int categorizedSeats = categories.values().stream().mapToInt(List::size).sum();
            if (categorizedSeats < totalSeats) {
                requiredCategories.add(SeatCategory.NORMAL);
            }
            categories.keySet().stream()
                    .map(SeatCategory::fromString)
                    .filter(c -> !c.equals(SeatCategory.AISLE))
                    .forEach(requiredCategories::add);
        } else {
            requiredCategories.add(SeatCategory.NORMAL);
        }
        for (SeatCategory required : requiredCategories) {
            if (!pricedCategories.contains(required)) {
                throw new BusinessException("Missing ticket price for seat category: " + required.name());
            }
        }
        for (SeatCategory priced : pricedCategories) {
            if (!requiredCategories.contains(priced)) {
                throw new BusinessException("Ticket price provided for category '" + priced.name() + "' which is not used in this hall");
            }
        }
    }

    private void validateHallMutability(Hall hall, HallDTO dto) {
        if (!hall.getStatus().equals(HallStatus.fromString(dto.getStatus())) && showtimeRepository.existsByHallAndStatusIn(hall, ShowtimeStatus.LIVE_STATUSES)) {
            throw new BusinessException("Cannot modify status of this hall while it has scheduled showtimes");
        }

        if (showtimeRepository.existsByHallAndStatusIn(hall, ShowtimeStatus.COMMITTED_STATUSES)) {
            throw new BusinessException("Cannot modify this hall while it has published or running showtimes");
        }
    }

    private void applyDtoToHall(Hall hall, HallDTO dto) {
        HallType hallType = findHallType(dto.getTypeId());

        hall.setStatus(HallStatus.fromString(dto.getStatus()));
        hall.setType(hallType);
        hall.setSupports3D(dto.isSupports3D());

        mergeCategoryPrices(hall, dto.getTicketPricing());
        mergeSeats(hall, dto.getNumberOfRows(), dto.getSeatsPerRow(), dto.getLayout());
    }

    private void mergeCategoryPrices(Hall hall, List<TicketPricingDTO> pricingList) {
        Map<SeatCategory, BigDecimal> prices = new EnumMap<>(SeatCategory.class);
        for (TicketPricingDTO pricing : pricingList) {
            prices.put(SeatCategory.fromString(pricing.getSeatCategory()), pricing.getPrice());
        }
        hall.setCategoryPrices(prices);
    }

    private void mergeSeats(Hall hall, int newRows, int newCols, SeatLayoutDTO layoutDTO) {
        Map<String, List<String>> categories = (layoutDTO != null && layoutDTO.getCategories() != null)
                ? layoutDTO.getCategories()
                : Collections.emptyMap();

        Set<String> onSiteOnlySet = (layoutDTO != null && layoutDTO.getOnSiteOnly() != null)
                ? new HashSet<>(layoutDTO.getOnSiteOnly())
                : Collections.emptySet();

        hall.setTotalRows(newRows);
        hall.setTotalColumns(newCols);

        Map<String, SeatCategory> desired = validateAndMapLayout(hall, categories);

        // Validate onSiteOnly positions
        for (String position : onSiteOnlySet) {
            Matcher matcher = POSITION_PATTERN.matcher(position);
            if (!matcher.matches()) {
                throw new BusinessException("Invalid seat position format in (On site only): " + position);
            }
            int rowIndex = toRowIndex(matcher.group(1));
            int colNumber = Integer.parseInt(matcher.group(2));
            if (rowIndex > newRows || colNumber < 1 || colNumber > newCols) {
                throw new BusinessException("(On site only) position '" + position + "' is outside the hall grid");
            }
            SeatCategory category = desired.getOrDefault(position, SeatCategory.NORMAL);
            if (category.equals(SeatCategory.AISLE)) {
                throw new BusinessException("Aisle seat '" + position + "' cannot be marked as (On site only)");
            }
        }

        Map<SeatCategory, List<String>> categoriesByEnum = new EnumMap<>(SeatCategory.class);
        categories.forEach((category, positions) -> categoriesByEnum.put(SeatCategory.fromString(category), positions));

        hall.setLayout(new HallLayout(categoriesByEnum, new ArrayList<>(onSiteOnlySet)));
    }

    private Map<String, SeatCategory> validateAndMapLayout(Hall hall, Map<String, List<String>> layout) {
        Set<SeatCategory> seenCategories = EnumSet.noneOf(SeatCategory.class);
        Map<String, SeatCategory> assignedPositions = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : layout.entrySet()) {
            SeatCategory category = SeatCategory.fromString(entry.getKey());
            if (!seenCategories.add(category)) {
                throw new BusinessException("Duplicate seat category: " + category.name());
            }

            Set<String> seenPositions = new HashSet<>();
            for (String position : entry.getValue()) {
                if (!seenPositions.add(position)) {
                    throw new BusinessException("Seat position '" + position + "' is listed more than once in category: " + category.name());
                }

                Matcher matcher = POSITION_PATTERN.matcher(position);
                if (!matcher.matches()) {
                    throw new BusinessException("Invalid seat position format: " + position);
                }

                int rowIndex = toRowIndex(matcher.group(1));
                int colNumber = Integer.parseInt(matcher.group(2));

                if (rowIndex > hall.getTotalRows()) {
                    throw new BusinessException("Seat position '" + position + "' exceeds the hall's row count (" + hall.getTotalRows() + ")");
                }
                if (colNumber < 1 || colNumber > hall.getTotalColumns()) {
                    throw new BusinessException("Seat position '" + position + "' exceeds the hall's column count (" + hall.getTotalColumns() + ")");
                }
                if (assignedPositions.containsKey(position)) {
                    throw new BusinessException("Seat position '" + position + "' is assigned to multiple categories");
                }

                assignedPositions.put(position, category);
            }
        }

        return assignedPositions;
    }

    public HallLayoutDTO getHallLayout(Hall hall) {
        HallLayoutDTO dto = new HallLayoutDTO();
        dto.setNumberOfRows(hall.getTotalRows());
        dto.setSeatsPerRow(hall.getTotalColumns());
        dto.setLayout(toLayoutMap(hall));
        dto.setTicketPricing(toPricingList(hall));
        return dto;
    }

    private List<TicketPricingDTO> toPricingList(Hall hall) {
        return hall.getCategoryPrices().entrySet().stream()
                .map(entry -> {
                    TicketPricingDTO pricing = new TicketPricingDTO();
                    pricing.setSeatCategory(entry.getKey().name());
                    pricing.setPrice(entry.getValue());
                    return pricing;
                })
                .toList();
    }

    private SeatLayoutDTO toLayoutMap(Hall hall) {
        HallLayout layout = hall.getLayout();

        Map<String, List<String>> categories = new HashMap<>();
        layout.categories().forEach((category, positions) -> categories.put(category.name(), positions));

        SeatLayoutDTO dto = new SeatLayoutDTO();
        dto.setCategories(categories);
        dto.setOnSiteOnly(layout.onSiteOnly());
        return dto;
    }

    private HallSummaryDTO toSummaryDTO(Hall hall) {
        HallSummaryDTO summary = new HallSummaryDTO();
        summary.setId(hall.getUuid());
        summary.setName(hall.getName());
        summary.setStatus(hall.getStatus().name());
        summary.setTypeName(hall.getType().getName());
        summary.setSupports3D(hall.isSupports3D());
        summary.setTotalRows(hall.getTotalRows());
        summary.setTotalColumns(hall.getTotalColumns());
        return summary;
    }

    private static int toRowIndex(String rowLabel) {
        return (rowLabel.length() - 1) * 26 + (rowLabel.charAt(0) - 'A') + 1;
    }

    private static int positionRowIndex(String position) {
        Matcher matcher = POSITION_PATTERN.matcher(position);
        return matcher.matches() ? toRowIndex(matcher.group(1)) : 0;
    }

    private static int positionColumnNumber(String position) {
        Matcher matcher = POSITION_PATTERN.matcher(position);
        return matcher.matches() ? Integer.parseInt(matcher.group(2)) : 0;
    }
}
